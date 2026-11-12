
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  ClimateQuery,
  TemperatureResponse,
  TrendAnalysisResponse,
} from '../models/climate.model';

@Injectable({
  providedIn: 'root',
})
export class ClimateApiService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = 'http://127.0.0.1:8000/api/v1';

  getTemperatures(
    query: ClimateQuery,
  ): Observable<TemperatureResponse> {
    return this.http.get<TemperatureResponse>(
      `${this.baseUrl}/climate/temperature`,
      { params: this.createParams(query) },
    );
  }

  getTrendAnalysis(
    query: ClimateQuery,
  ): Observable<TrendAnalysisResponse> {
    return this.http.get<TrendAnalysisResponse>(
      `${this.baseUrl}/analysis/trends`,
      { params: this.createParams(query) },
    );
  }

  private createParams(query: ClimateQuery): HttpParams {
    return new HttpParams()
      .set('latitude', query.latitude)
      .set('longitude', query.longitude)
      .set('start_year', query.start_year)
      .set('end_year', query.end_year);
  }
}
