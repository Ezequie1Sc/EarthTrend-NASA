"""Decode real NetCDF; never interpolate sparse point observations."""
from datetime import date, datetime, timezone
import hashlib
import numpy as np
import xarray as xr
from app.schemas.thermal import ThermalGrid, Provider

class InvalidGrid(ValueError):
    pass


def normalize_dataset(ds: xr.Dataset, day: date, provider: Provider, digest: str, source_url: str) -> ThermalGrid:
    variable = 'air' if provider == 'noaa' else 'T2M'
    if variable not in ds or not {'time', 'lat', 'lon'} <= set(ds[variable].dims):
        raise InvalidGrid('Expected time/lat/lon near-surface air temperature')
    a = ds[variable]
    if set(a.dims) != {'time', 'lat', 'lon'}:
        raise InvalidGrid('Unexpected vertical or ensemble dimension')
    times = np.asarray(ds.time.values).astype('datetime64[m]')
    expected = np.datetime64(day.isoformat())
    if len(times) == 0 or np.any(times.astype('datetime64[D]') != expected):
        raise InvalidGrid('Upstream returned a different date; refusing nearest-day substitution')
    if provider == 'noaa':
        if a.sizes['time'] != 1 or '2 m' not in str(a.attrs.get('level_desc', '')):
            raise InvalidGrid('Expected one daily mean at 2 m')
        if 'daily' not in str(a.attrs.get('long_name', '')).lower() or a.attrs.get('statistic') != 'Mean':
            raise InvalidGrid('Expected absolute daily mean, not anomalies or instantaneous data')
        data = a.isel(time=0)
        shape = (94, 192)
    else:
        hours = expected.astype('datetime64[m]') + np.arange(24) * np.timedelta64(60, 'm') + np.timedelta64(30, 'm')
        if len(times) != 24 or not np.array_equal(times, hours):
            raise InvalidGrid('M2T1NXSLV requires all 24 hourly means, 00:30–23:30 UTC')
        title = str(ds.attrs.get('ShortName', '')) + str(ds.attrs.get('title', ''))
        if 'M2T1NXSLV' not in title and 'tavg1_2d_slv_Nx' not in title:
            raise InvalidGrid('File must identify the MERRA-2 M2T1NXSLV product')
        # Strict completeness: if one hour is absent, that daily cell remains missing.
        data = a.mean('time', skipna=False)
        shape = (361, 576)
    units = str(a.attrs.get('units', '')).strip().lower()
    if units not in {'k', 'degk', 'kelvin', 'degrees_kelvin'}:
        raise InvalidGrid(f'Unexpected source units: {units}; expected Kelvin')
    lat = np.asarray(ds.lat.values, dtype=float)
    lon = (np.asarray(ds.lon.values, dtype=float) + 180) % 360 - 180
    if lat.ndim != 1 or lon.ndim != 1 or (len(lat), len(lon)) != shape:
        raise InvalidGrid('Not the full native global grid')
    if not np.all(np.isfinite(lat)) or not np.all(np.isfinite(lon)):
        raise InvalidGrid('Non-finite coordinates')
    yi, xi = np.argsort(-lat), np.argsort(lon)
    lat, lon = lat[yi], lon[xi]
    if np.any(np.diff(lat) >= 0) or not np.allclose(np.diff(lon), 360 / len(lon), atol=.001):
        raise InvalidGrid('Duplicate or incomplete coordinates')
    if lat[0] < 88 or lat[-1] > -88 or not np.isclose(lon[0], -180, atol=.001):
        raise InvalidGrid('Grid does not cover the globe')
    if provider == 'merra2' and not np.allclose(lat, np.linspace(90, -90, 361), atol=.001):
        raise InvalidGrid('Unexpected MERRA-2 latitude grid')
    values = np.asarray(data.transpose('lat', 'lon').values, dtype=float)[yi][:, xi]
    # Physical bounds also mask undecoded fill sentinels. No spatial gap filling.
    values[(values < 150) | (values > 400) | ~np.isfinite(values)] = np.nan
    values -= 273.15
    flat = [round(float(v), 2) if np.isfinite(v) else None for v in values.ravel()]
    valid = [v for v in flat if v is not None]
    if not valid:
        raise InvalidGrid('No valid temperatures in source')
    return ThermalGrid(
        provider=provider, date=day,
        source='NOAA PSL / NCEP–NCAR Reanalysis 1' if provider == 'noaa' else 'NASA GMAO / MERRA-2 M2T1NXSLV v5.12.4',
        source_url=source_url, source_sha256=digest,
        retrieved_at=datetime.now(timezone.utc).isoformat(),
        resolution='192 × 94 Gaussian grid; 1.875° longitude, ~1.9° latitude' if provider == 'noaa' else '576 × 361; 0.625° longitude × 0.5° latitude',
        latitudes=lat.tolist(), longitudes=lon.tolist(), width=len(lon), height=len(lat),
        values=flat, valid_cells=len(valid), minimum=min(valid), maximum=max(valid),
        notes=[
            'Absolute air temperature at 2 m; daily mean in UTC, not an anomaly.',
            'Reanalysis combines a numerical model and observations; not direct measurements at every cell.',
            'Bilinear display resampling does not increase the native scientific resolution.',
            'Missing cells remain transparent.',
        ] + (['Polar caps beyond ±88.542° use the nearest latitude row for display only.',
               'Archive ends 2026-03-17; this is not a live weather product.'] if provider == 'noaa' else
              ['Daily mean of all 24 hourly T2M fields; missing hours invalidate that cell.']),
    )
