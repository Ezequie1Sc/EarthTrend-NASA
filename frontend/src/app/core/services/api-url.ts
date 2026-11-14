import { InjectionToken } from '@angular/core';

const API_BASE_URL =
  'https://earthtrend-nasa-api.onrender.com/api/v1';

export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => API_BASE_URL,
});