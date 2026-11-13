import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { timeout } from 'rxjs';
import { ThermalGrid, ThermalProvider, ThermalSource } from '../models/thermal.model';
import { API_URL } from './api-url';

@Injectable({ providedIn: 'root' })
export class TemperatureGridService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_URL);
  sources() { return this.http.get<ThermalSource[]>(`${this.base}/thermal/sources`).pipe(timeout(15000)); }
  getTemperatureGrid(date: string, provider: ThermalProvider) {
    return this.http.get<ThermalGrid>(`${this.base}/thermal/grid`, { params: { date, provider } }).pipe(timeout(65000));
  }
}
