from datetime import date
from pathlib import Path
import asyncio
import gzip
import hashlib
import io
import os
import tempfile

import httpx
import xarray as xr
from app.schemas.thermal import ThermalGrid, ThermalSource, Provider
from app.services.thermal_processing import normalize_dataset, InvalidGrid

DATA = Path(__file__).resolve().parents[2] / 'data'
START, END = date(1948, 1, 1), date(2026, 3, 17)
MAX_BYTES = 2_000_000

class ThermalError(Exception):
    def __init__(self, message: str, status: int = 502):
        self.status = status
        super().__init__(message)


def write_grid(path: Path, grid: ThermalGrid):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(dir=path.parent, suffix='.tmp')
    try:
        with os.fdopen(fd, 'wb') as f:
            f.write(gzip.compress(grid.model_dump_json().encode()))
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def read_grid(path: Path, provider: Provider, day: date):
    if not path.is_file():
        return None
    try:
        with gzip.open(path, 'rb') as f:
            raw = f.read(8_000_001)
        if len(raw) > 8_000_000:
            return None
        grid = ThermalGrid.model_validate_json(raw)
        return grid if grid.provider == provider and grid.date == day else None
    except (OSError, ValueError, EOFError):
        return None


class ThermalService:
    def __init__(self, cache: Path | None = None, data: Path = DATA, transport=None):
        self.cache = cache or Path(os.getenv('THERMAL_CACHE_DIR', str(DATA / 'cache')))
        self.data = data
        self.transport = transport
        self.locks = [asyncio.Lock() for _ in range(32)]
        self.slots = asyncio.Semaphore(2)

    def sources(self):
        dates = []
        for p in sorted((self.data / 'merra2').glob('*.json.gz')):
            try:
                dates.append(date.fromisoformat(p.name.removesuffix('.json.gz')))
            except ValueError:
                continue
        return [ThermalSource(id='noaa', name='NOAA / NCEP–NCAR R1', resolution='192 × 94 · ~1.9°',
                              start=START, end=END, available=True,
                              note='Daily mean at 2 m · archive ends 17 March 2026'),
                ThermalSource(id='merra2', name='NASA / MERRA-2', resolution='576 × 361 · 0.5° × 0.625°',
                              start=min(dates) if dates else None, end=max(dates) if dates else None,
                              dates=dates, available=bool(dates),
                              note='Imported daily means; download M2T1NXSLV with Earthdata and run the importer.')]

    async def get_grid(self, day: date, provider: Provider):
        if provider == 'noaa' and not START <= day <= END:
            raise ThermalError('NOAA archive supports 1948-01-01 through 2026-03-17.', 422)
        if provider == 'merra2':
            grid = await asyncio.to_thread(read_grid, self.data / 'merra2' / f'{day}.json.gz', provider, day)
            if grid is None:
                raise ThermalError('MERRA-2 date is not imported. See docs/thermal/DATA_SOURCES.md.', 404)
            return grid
        key = f'noaa-v1-{day}.json.gz'
        async with self.locks[day.toordinal() % len(self.locks)]:
            for path in [self.cache / key, self.data / 'examples' / key]:
                cached = await asyncio.to_thread(read_grid, path, provider, day)
                if cached is not None:
                    return cached
            grid = await self.download(day)
            try:
                await asyncio.to_thread(self.save_cache, key, grid)
            except OSError:
                # A read-only cache must not prevent serving a valid scientific grid.
                pass
            return grid

    def save_cache(self, key, grid):
        write_grid(self.cache / key, grid)
        files = sorted(self.cache.glob('noaa-v1-*.json.gz'), key=lambda p: p.stat().st_mtime)
        for path in files[:-256]:
            path.unlink(missing_ok=True)

    async def download(self, day):
        url = f'https://psl.noaa.gov/thredds/ncss/grid/Datasets/ncep.reanalysis/Dailies/surface_gauss/air.2m.gauss.{day.year}.nc'
        params = {'var': 'air', 'time': f'{day}T00:00:00Z', 'accept': 'netcdf3'}
        try:
            async with self.slots, asyncio.timeout(55):
                async with httpx.AsyncClient(timeout=httpx.Timeout(45, connect=10), follow_redirects=True, transport=self.transport) as client:
                    async with client.stream('GET', url, params=params) as response:
                        if response.status_code == 404:
                            raise ThermalError('Requested day is unavailable at NOAA.', 404)
                        response.raise_for_status()
                        chunks = bytearray()
                        async for chunk in response.aiter_bytes():
                            chunks.extend(chunk)
                            if len(chunks) > MAX_BYTES:
                                raise ThermalError('NOAA subset exceeded the 2 MB safety limit.')
            return await asyncio.to_thread(self.decode, bytes(chunks), day, str(response.url))
        except (httpx.TimeoutException, TimeoutError) as exc:
            raise ThermalError('NOAA timed out. Retry this date later.', 504) from exc
        except httpx.HTTPError as exc:
            raise ThermalError('NOAA could not deliver the daily subset. Retry later.') from exc

    @staticmethod
    def decode(raw, day, url):
        try:
            with xr.open_dataset(io.BytesIO(raw), engine='scipy') as ds:
                return normalize_dataset(ds, day, 'noaa', hashlib.sha256(raw).hexdigest(), url)
        except (ValueError, OSError, TypeError, KeyError) as exc:
            raise ThermalError(f'Invalid NOAA daily grid: {exc}') from exc
