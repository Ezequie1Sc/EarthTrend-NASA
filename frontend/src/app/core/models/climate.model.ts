
export interface ClimateQuery {
  latitude: number;
  longitude: number;
  start_year: number;
  end_year: number;
}

export interface TemperatureRecord {
  year: number;
  temperature: number;
}

export interface TemperatureResponse extends ClimateQuery {
  parameter: string;
  unit: string;
  records: TemperatureRecord[];
  source: string;
}

export type ClimateTrend = 'warming' | 'cooling' | 'stable';

export interface TrendAnalysisResponse extends ClimateQuery {
  observations: number;
  slope_celsius_per_year: number;
  slope_celsius_per_decade: number;
  intercept: number;
  r_squared: number;
  p_value: number;
  significant: boolean;
  trend: ClimateTrend;
  confidence_level: number;
  source: string;
  years: number[];
  temperatures: number[];
}
