
import {
  Component,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import type {
  ClimateQuery,
} from '../../../../core/models/climate.model';

export interface SelectedCoordinates {
  latitude: number;
  longitude: number;
}

interface CityOption {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-location-selector',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section
      class="w-full min-w-0 rounded-2xl border
             border-sky-900/70 bg-[#091a30]
             p-5 text-white sm:p-6"
    >
      <!-- HEADER -->
      <div class="mb-6">
        <p
          class="text-xs font-semibold uppercase
                 tracking-[0.18em] text-sky-400"
        >
          Climate Analysis
        </p>

        <h2 class="mt-2 text-lg font-semibold">
          Explore climate data
        </h2>

        <p class="mt-2 text-sm leading-6 text-slate-400">
          Select a location and historical period
          to investigate temperature trends.
        </p>
      </div>

      <form (ngSubmit)="submitAnalysis()">

        <!-- ADAPTIVE FORM GRID -->
        <div
          [class]="
            horizontal()
              ? 'grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4 xl:items-end'
              : 'grid grid-cols-1 gap-5'
          "
        >

          <!-- LOCATION -->
          <div class="min-w-0">
            <label
              for="climate-location"
              class="mb-2 block text-xs font-medium text-slate-200"
            >
              Location
            </label>

            <select
              id="climate-location"
              name="location"
              [ngModel]="selectedCity()"
              (ngModelChange)="onCityChange($event)"
              class="h-11 w-full min-w-0 rounded-lg
                     border border-sky-700 bg-[#102743]
                     px-3 text-sm text-white outline-none
                     focus:border-sky-400
                     focus:ring-2 focus:ring-sky-500/20"
            >
              @for (city of cities; track city.id) {
                <option [value]="city.id">
                  {{ city.label }}
                </option>
              }
              <option value="custom">
                Custom coordinates
              </option>
            </select>
          </div>

          <!-- COORDINATES -->
          <div class="min-w-0">
            <p
              class="mb-2 text-xs font-semibold uppercase
                     tracking-wider text-sky-400"
              [class.hidden]="!horizontal()"
            >
              Coordinates
            </p>

            <div class="grid grid-cols-2 gap-3">
              <div class="min-w-0">
                <label
                  for="climate-latitude"
                  class="mb-2 block text-xs font-medium
                         text-slate-200"
                >
                  Latitude
                </label>

                <input
                  id="climate-latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  required
                  [ngModel]="latitude()"
                  (ngModelChange)="onLatitudeChange($event)"
                  class="h-11 w-full min-w-0 rounded-lg
                         border border-sky-700 bg-[#102743]
                         px-3 text-sm text-white outline-none
                         focus:border-sky-400"
                />
              </div>

              <div class="min-w-0">
                <label
                  for="climate-longitude"
                  class="mb-2 block text-xs font-medium
                         text-slate-200"
                >
                  Longitude
                </label>

                <input
                  id="climate-longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  required
                  [ngModel]="longitude()"
                  (ngModelChange)="onLongitudeChange($event)"
                  class="h-11 w-full min-w-0 rounded-lg
                         border border-sky-700 bg-[#102743]
                         px-3 text-sm text-white outline-none
                         focus:border-sky-400"
                />
              </div>
            </div>
          </div>

          <!-- HISTORICAL PERIOD -->
          <div class="min-w-0">
            <p
              class="mb-2 text-xs font-semibold uppercase
                     tracking-wider text-sky-400"
            >
              Historical period
            </p>

            <div class="grid grid-cols-2 gap-3">
              <div class="min-w-0">
                <label
                  for="climate-start-year"
                  class="mb-2 block text-xs font-medium
                         text-slate-200"
                >
                  Start year
                </label>

                <input
                  id="climate-start-year"
                  name="startYear"
                  type="number"
                  min="1981"
                  max="2025"
                  step="1"
                  required
                  [ngModel]="startYear()"
                  (ngModelChange)="startYear.set($event)"
                  class="h-11 w-full min-w-0 rounded-lg
                         border border-sky-700 bg-[#102743]
                         px-3 text-sm text-white outline-none
                         focus:border-sky-400"
                />
              </div>

              <div class="min-w-0">
                <label
                  for="climate-end-year"
                  class="mb-2 block text-xs font-medium
                         text-slate-200"
                >
                  End year
                </label>

                <input
                  id="climate-end-year"
                  name="endYear"
                  type="number"
                  min="1981"
                  max="2025"
                  step="1"
                  required
                  [ngModel]="endYear()"
                  (ngModelChange)="endYear.set($event)"
                  class="h-11 w-full min-w-0 rounded-lg
                         border border-sky-700 bg-[#102743]
                         px-3 text-sm text-white outline-none
                         focus:border-sky-400"
                />
              </div>
            </div>
          </div>

          <!-- ANALYZE BUTTON -->
          <div class="flex min-w-0 flex-col justify-end">
            @if (horizontal()) {
              <p
                class="mb-2 text-xs font-semibold uppercase
                       tracking-wider text-sky-400"
              >
                Run analysis
              </p>
            }

            <button
              type="submit"
              [disabled]="!isValid()"
              class="flex h-11 w-full items-center
                     justify-center gap-2 rounded-lg
                     bg-sky-600 px-4 text-sm font-semibold
                     text-white transition hover:bg-sky-500
                     disabled:cursor-not-allowed
                     disabled:opacity-40"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M3 3v18h18" />
                <path d="m7 15 4-4 3 3 6-7" />
              </svg>
              Analyze climate trends
            </button>
          </div>
        </div>

        @if (!isValid()) {
          <p
            role="alert"
            class="mt-4 rounded-lg border border-amber-900/60
                   bg-amber-950/20 px-4 py-3
                   text-xs text-amber-200"
          >
            {{ validationMessage() }}
          </p>
        }

        <div
          class="mt-5 flex flex-wrap justify-between gap-2
                 border-t border-sky-900/60 pt-4
                 text-xs text-slate-500"
        >
          <span>Annual temperature observations</span>
          <span>NASA POWER</span>
        </div>
      </form>
    </section>
  `,
})
export class LocationSelector {
  readonly coordinates =
    input<SelectedCoordinates | null>(null);

  readonly horizontal = input(false);

  readonly analyze = output<ClimateQuery>();

  readonly cities: CityOption[] = [
    {
      id: 'campeche',
      label: 'Campeche, Mexico',
      latitude: 19.845,
      longitude: -90.523,
    },
    {
      id: 'mexico-city',
      label: 'Mexico City, Mexico',
      latitude: 19.4326,
      longitude: -99.1332,
    },
    {
      id: 'new-york',
      label: 'New York, USA',
      latitude: 40.7128,
      longitude: -74.006,
    },
    {
      id: 'london',
      label: 'London, UK',
      latitude: 51.5074,
      longitude: -0.1278,
    },
    {
      id: 'tokyo',
      label: 'Tokyo, Japan',
      latitude: 35.6762,
      longitude: 139.6503,
    },
  ];

  readonly selectedCity = signal('campeche');

  readonly latitude = signal<number | null>(19.845);
  readonly longitude = signal<number | null>(-90.523);

  readonly startYear = signal<number | null>(2000);
  readonly endYear = signal<number | null>(2024);

  constructor() {
    effect(() => {
      const coordinates = this.coordinates();

      if (!coordinates) {
        return;
      }

      if (
        !Number.isFinite(coordinates.latitude) ||
        !Number.isFinite(coordinates.longitude) ||
        coordinates.latitude < -90 ||
        coordinates.latitude > 90 ||
        coordinates.longitude < -180 ||
        coordinates.longitude > 180
      ) {
        return;
      }

      this.latitude.set(coordinates.latitude);
      this.longitude.set(coordinates.longitude);

      const city = this.cities.find(
        item =>
          Math.abs(
            item.latitude - coordinates.latitude,
          ) < 0.000001 &&
          Math.abs(
            item.longitude - coordinates.longitude,
          ) < 0.000001,
      );

      this.selectedCity.set(city?.id ?? 'custom');
    });
  }

  onCityChange(id: string): void {
    this.selectedCity.set(id);

    const city = this.cities.find(
      item => item.id === id,
    );

    if (city) {
      this.latitude.set(city.latitude);
      this.longitude.set(city.longitude);
    }
  }

  onLatitudeChange(value: number | null): void {
    this.latitude.set(value);
    this.selectedCity.set('custom');
  }

  onLongitudeChange(value: number | null): void {
    this.longitude.set(value);
    this.selectedCity.set('custom');
  }

  isValid(): boolean {
    const lat = this.latitude();
    const lon = this.longitude();
    const start = this.startYear();
    const end = this.endYear();

    if (
      lat === null ||
      lon === null ||
      start === null ||
      end === null
    ) {
      return false;
    }

    return (
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180 &&
      Number.isInteger(start) &&
      Number.isInteger(end) &&
      start >= 1981 &&
      end <= 2025 &&
      start <= end &&
      end - start + 1 >= 3
    );
  }

  validationMessage(): string {
    const lat = this.latitude();
    const lon = this.longitude();
    const start = this.startYear();
    const end = this.endYear();

    if (
      lat === null ||
      lon === null ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      return 'Enter valid latitude (-90 to 90) and longitude (-180 to 180).';
    }

    if (
      start === null ||
      end === null ||
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < 1981 ||
      end > 2025
    ) {
      return 'Select years between 1981 and 2025.';
    }

    if (start > end) {
      return 'The start year must not be later than the end year.';
    }

    return 'Select at least three years of observations.';
  }

  submitAnalysis(): void {
    if (!this.isValid()) {
      return;
    }

    const latitude = this.latitude();
    const longitude = this.longitude();
    const start = this.startYear();
    const end = this.endYear();

    if (
      latitude === null ||
      longitude === null ||
      start === null ||
      end === null
    ) {
      return;
    }

    this.analyze.emit({
      latitude,
      longitude,
      start_year: start,
      end_year: end,
    });
  }
}
