"""Numerical fixtures below are tests only; never shipped as climate data."""
import asyncio
from datetime import date
from pathlib import Path
from unittest.mock import AsyncMock
import numpy as np
import pytest
import httpx
import xarray as xr
from fastapi.testclient import TestClient
from app.main import app
from app.api.routes import thermal
from app.services.thermal_processing import normalize_dataset, InvalidGrid
from app.services.thermal_service import ThermalService, ThermalError, DATA, read_grid, write_grid

DAY = date(2024, 6, 15)


def dataset():
    lat = np.linspace(88.542, -88.542, 94)
    lon = np.arange(192)*1.875
    a = np.full((1, 94, 192), 273.15)
    a[0, 0, 96] = 293.15  # North, -180 after longitude normalization.
    a[0, -1, 0] = 253.15  # South, Greenwich.
    ds = xr.Dataset({'air': (('time','lat','lon'), a)}, coords={'time': [np.datetime64(DAY)], 'lat':lat, 'lon':lon})
    ds.air.attrs.update(units='degK', level_desc='2 m', statistic='Mean', long_name='mean Daily Air temperature at 2 m')
    return ds


def normalize(ds):
    return normalize_dataset(ds, DAY, 'noaa', 'test-only', 'https://example.test')


def test_unit_conversion_and_coordinate_orientation():
    g=normalize(dataset())
    assert g.longitudes[0] == -180
    assert g.latitudes[0] > 88 and g.latitudes[-1] < -88
    assert g.values[0] == 20
    assert g.values[93*192+96] == -20
    assert g.values[96] == 0


def test_south_to_north_input_reorders_values_with_coordinates():
    g=normalize(dataset().sortby('lat'))
    assert g.values[0] == 20 and g.values[93*192+96] == -20


def test_missing_and_fill_values_are_null():
    ds=dataset();ds.air.values[0,10,0]=np.nan;ds.air.values[0,11,0]=-9.96921e36
    g=normalize(ds)
    assert g.valid_cells == 18046
    assert g.values[10*192+96] is None and g.values[11*192+96] is None


@pytest.mark.parametrize('change', ['date','units','dimension','regional','anomaly','duplicate','nonfinite'])
def test_invalid_source_is_rejected(change):
    ds=dataset()
    if change=='date':ds=ds.assign_coords(time=[np.datetime64('2024-06-16')])
    if change=='units':ds.air.attrs['units']='degC'
    if change=='dimension':ds=ds.rename({'lat':'latitude'})
    if change=='regional':ds=ds.isel(lon=slice(0,100))
    if change=='anomaly':ds.air.attrs['statistic']='Anomaly'
    if change=='duplicate':ds=ds.assign_coords(lon=np.zeros(192))
    if change=='nonfinite':ds=ds.assign_coords(lat=np.full(94,np.nan))
    with pytest.raises(InvalidGrid):normalize(ds)


def test_all_missing_is_rejected():
    ds=dataset();ds.air.values[:]=np.nan
    with pytest.raises(InvalidGrid):normalize(ds)


def test_merra2_complete_day_and_missing_hour():
    hours=np.datetime64('2024-06-15T00:30')+np.arange(24)*np.timedelta64(1,'h')
    # Broadcast analytical fixture; product-sized axes verify true MERRA grid semantics.
    a=np.broadcast_to(np.full((24,1,1),280.),(24,361,576)).copy()
    a[0,0,0]=np.nan
    ds=xr.Dataset({'T2M':(('time','lat','lon'),a)},coords={'time':hours,'lat':np.linspace(-90,90,361),'lon':np.arange(576)*.625-180},attrs={'ShortName':'M2T1NXSLV'})
    ds.T2M.attrs['units']='K'
    g=normalize_dataset(ds,DAY,'merra2','fixture','https://example.test')
    assert g.width==576 and g.height==361 and g.values[-576] is None
    assert g.values[0]==6.85
    with pytest.raises(InvalidGrid):normalize_dataset(ds.isel(time=slice(0,23)),DAY,'merra2','fixture','https://example.test')
    with pytest.raises(InvalidGrid):normalize_dataset(ds.assign_attrs(ShortName='different'),DAY,'merra2','fixture','https://example.test')


def test_endpoints_and_dates(monkeypatch, tmp_path):
    monkeypatch.setattr(thermal,'service',ThermalService(cache=tmp_path))
    with TestClient(app) as c:
        sources=c.get('/api/v1/thermal/sources').json()
        assert sources[0]['end']=='2026-03-17'
        for invalid in ['2024-02-30','1947-12-31','2026-03-18','tomorrow']:
            assert c.get('/api/v1/thermal/grid',params={'date':invalid}).status_code==422
        assert c.get('/api/v1/thermal/grid',params={'date':str(DAY),'provider':'invalid'}).status_code==422
        assert c.get('/api/v1/thermal/grid',params={'date':str(DAY),'provider':'merra2'}).status_code==404
        r=c.get('/api/v1/thermal/grid',params={'date':str(DAY)})
        assert r.status_code==200 and r.json()['valid_cells']==18048
        assert r.headers['cache-control']=='public, max-age=86400'
        assert 'source_sha256' in r.json()
        winter=c.get('/api/v1/thermal/grid',params={'date':'2024-12-15'}).json()
        assert winter['values']!=r.json()['values']
        assert '/api/v1/climate/temperature' in c.get('/openapi.json').json()['paths']
        assert '/api/v1/analysis/trends' in c.get('/openapi.json').json()['paths']


def test_real_archived_grids_and_hemispheric_seasons():
    summer=read_grid(DATA/'examples'/f'noaa-v1-{DAY}.json.gz','noaa',DAY)
    winter=read_grid(DATA/'examples'/'noaa-v1-2024-12-15.json.gz','noaa',date(2024,12,15))
    assert summer and winter
    assert len(summer.source_sha256)==64
    # Arctic summer warmer than winter; Antarctic winter colder than summer.
    assert np.mean(summer.values[:192])>np.mean(winter.values[:192])
    assert np.mean(summer.values[-192:])<np.mean(winter.values[-192:])


def test_cache_coalesces_concurrent_requests_and_recovers_corruption(tmp_path):
    async def check():
        s=ThermalService(cache=tmp_path/'cache', data=tmp_path/'data')
        grid=normalize(dataset());s.download=AsyncMock(return_value=grid)
        grids=await asyncio.gather(*[s.get_grid(DAY,'noaa') for _ in range(5)])
        assert len(grids)==5 and s.download.await_count==1
        assert await s.get_grid(DAY,'noaa')==grid and s.download.await_count==1
        (s.cache/f'noaa-v1-{DAY}.json.gz').write_bytes(b'broken gzip')
        await s.get_grid(DAY,'noaa');assert s.download.await_count==2
    asyncio.run(check())


@pytest.mark.parametrize('mode,status',[('404',404),('500',502),('timeout',504),('oversize',502),('html',502),('wrong_date',502)])
def test_upstream_failures(mode,status,tmp_path):
    def handler(request):
        if mode=='timeout':raise httpx.ReadTimeout('test timeout',request=request)
        if mode in {'404','500'}:return httpx.Response(int(mode))
        if mode=='oversize':return httpx.Response(200,content=b'x'*2_000_001)
        if mode=='html':return httpx.Response(200,text='<html>Not a NetCDF file</html>')
        ds=dataset().assign_coords(time=[np.datetime64('2024-06-16')])
        return httpx.Response(200,content=bytes(ds.to_netcdf(engine='scipy')))
    s=ThermalService(cache=tmp_path,data=tmp_path,transport=httpx.MockTransport(handler))
    with pytest.raises(ThermalError) as error:asyncio.run(s.get_grid(DAY,'noaa'))
    assert error.value.status==status


def test_subset_only_requests_one_day_and_caches(tmp_path):
    requests=[]
    def handler(request):
        requests.append(request)
        return httpx.Response(200,content=bytes(dataset().to_netcdf(engine='scipy')))
    s=ThermalService(cache=tmp_path,data=tmp_path/'data',transport=httpx.MockTransport(handler))
    async def check():
        await s.get_grid(DAY,'noaa');await s.get_grid(DAY,'noaa')
    asyncio.run(check())
    assert len(requests)==1 and requests[0].url.params['time']=='2024-06-15T00:00:00Z'
    assert requests[0].url.params['var']=='air'


def test_cache_is_bounded_and_imported_dates_discovered(tmp_path):
    s=ThermalService(cache=tmp_path/'cache',data=tmp_path/'data');s.cache.mkdir()
    for i in range(260):(s.cache/f'noaa-v1-old-{i}.json.gz').write_bytes(b'')
    s.save_cache(f'noaa-v1-{DAY}.json.gz',normalize(dataset()))
    assert len(list(s.cache.glob('*.json.gz')))==256
    p=s.data/'merra2';p.mkdir(parents=True);(p/'2024-06-15.json.gz').touch();(p/'invalid.json.gz').touch()
    assert s.sources()[1].dates==[DAY]
