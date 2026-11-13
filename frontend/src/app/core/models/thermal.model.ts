export type ThermalProvider = 'noaa' | 'merra2';
export interface ThermalSource {
  id: ThermalProvider; name: string; resolution: string;
  start: string | null; end: string | null; dates: string[] | null;
  available: boolean; note: string;
}
export interface ThermalGrid {
  schema_version: 1; provider: ThermalProvider; date: string;
  source: string; source_url: string; source_sha256: string; retrieved_at: string;
  variable: 'air_temperature_2m'; statistic: 'daily_mean'; unit: '°C';
  resolution: string; latitudes: number[]; longitudes: number[];
  values: (number | null)[]; width: number; height: number;
  valid_cells: number; minimum: number; maximum: number; notes: string[];
}
