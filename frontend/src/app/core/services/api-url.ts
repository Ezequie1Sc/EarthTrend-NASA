import { InjectionToken } from '@angular/core';
/** Same-origin API; Angular dev server proxies /api to FastAPI. */
export const API_URL = new InjectionToken<string>('API_URL', { providedIn: 'root', factory: () => '/api/v1' });
