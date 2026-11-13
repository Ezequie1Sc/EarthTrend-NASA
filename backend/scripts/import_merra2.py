"""Import one complete global hourly M2T1NXSLV NetCDF. No credentials handled."""
import argparse
from datetime import date
import hashlib
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import xarray as xr
from app.services.thermal_processing import normalize_dataset
from app.services.thermal_service import DATA, write_grid


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('file', type=Path)
    parser.add_argument('--date', type=date.fromisoformat, required=True)
    parser.add_argument('--output-dir', type=Path, default=DATA / 'merra2')
    args = parser.parse_args()
    digest = hashlib.sha256()
    with args.file.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            digest.update(chunk)
    # Only the selected T2M variable is loaded, not every field in the daily file.
    with xr.open_dataset(args.file) as ds:
        grid = normalize_dataset(ds, args.date, 'merra2', digest.hexdigest(),
                                 'https://doi.org/10.5067/VJAFPLI1CSIV')
    destination = args.output_dir / f'{args.date}.json.gz'
    write_grid(destination, grid)
    print(f'Imported {grid.valid_cells}/{grid.width * grid.height} cells: {destination}')

if __name__ == '__main__':
    main()
