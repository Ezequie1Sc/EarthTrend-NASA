
import { Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import type { ClimateQuery } from '../../../../core/models/climate.model';

interface ClimateLocation {
  name: string;
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-location-selector',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="mb-6">
        <h2 class="text-lg font-semibold text-slate-900">
          Climate exploration
        </h2>
        <p class="mt-1 text-sm text-slate-500">
          Select a location and time period to analyze historical temperature trends.
        </p>
      </div>

      <form (ngSubmit)="submit()" class="space-y-5">
        <div>
          <label for="location" class="mb-2 block text-sm font-medium text-slate-700">
            Location
          </label>

          <select
            id="location"
            name="location"
            [ngModel]="selectedLocation()"
            (ngModelChange)="selectLocation($event)"
            class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
          >
            @for (location of locations; track location.name) {
              <option [value]="location.name">
                {{ location.name }}
              </option>
            }
            <option value="Custom">Custom coordinates</option>
          </select>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label for="latitude" class="mb-2 block text-sm font-medium text-slate-700">
              Latitude
            </label>
            <input
              id="latitude"
              name="latitude"
              type="number"
              step="any"
              min="-90"
              max="90"
              required
              [ngModel]="latitude()"
              (ngModelChange)="latitude.set($event)"
              class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label for="longitude" class="mb-2 block text-sm font-medium text-slate-700">
              Longitude
            </label>
            <input
              id="longitude"
              name="longitude"
              type="number"
              step="any"
              min="-180"
              max="180"
              required
              [ngModel]="longitude()"
              (ngModelChange)="longitude.set($event)"
              class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label for="startYear" class="mb-2 block text-sm font-medium text-slate-700">
              Start year
            </label>
            <input
              id="startYear"
              name="startYear"
              type="number"
              min="1981"
              [max]="endYear() - 2"
              required
              [ngModel]="startYear()"
              (ngModelChange)="startYear.set($event)"
              class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label for="endYear" class="mb-2 block text-sm font-medium text-slate-700">
              End year
            </label>
            <input
              id="endYear"
              name="endYear"
              type="number"
              [min]="startYear() + 2"
              [max]="maxYear"
              required
              [ngModel]="endYear()"
              (ngModelChange)="endYear.set($event)"
              class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
          </div>
        </div>

        @if (error()) {
          <p role="alert" class="text-sm text-red-600">
            {{ error() }}
          </p>
        }

        <button
          type="submit"
          class="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Analyze climate trends
        </button>
      </form>
    </section>
  `,
})
export class LocationSelector {
  readonly analyze = output<ClimateQuery>();

  readonly locations: ClimateLocation[] = [
    { name: 'Campeche, Mexico', latitude: 19.845, longitude: -90.523 },
    { name: 'Mexico City, Mexico', latitude: 19.4326, longitude: -99.1332 },
    { name: 'New York, USA', latitude: 40.7128, longitude: -74.006 },
    { name: 'London, UK', latitude: 51.5074, longitude: -0.1278 },
    { name: 'Tokyo, Japan', latitude: 35.6762, longitude: 139.6503 },
  ];

  readonly maxYear = 2025;

  readonly selectedLocation = signal('Campeche, Mexico');
  readonly latitude = signal(19.845);
  readonly longitude = signal(-90.523);
  readonly startYear = signal(2000);
  readonly endYear = signal(2024);
  readonly error = signal('');

  selectLocation(name: string): void {
    this.selectedLocation.set(name);

    const location = this.locations.find(
      (item) => item.name === name,
    );

    if (location) {
      this.latitude.set(location.latitude);
      this.longitude.set(location.longitude);
    }
  }

  submit(): void {
    this.error.set('');

    const latitude = Number(this.latitude());
    const longitude = Number(this.longitude());
    const startYear = Number(this.startYear());
    const endYear = Number(this.endYear());

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      this.error.set('Enter valid latitude and longitude coordinates.');
      return;
    }

    if (
      !Number.isInteger(startYear) ||
      !Number.isInteger(endYear) ||
      startYear < 1981 ||
      endYear > this.maxYear ||
      endYear - startYear < 2
    ) {
      this.error.set('Select a valid period containing at least three years.');
      return;
    }

    this.analyze.emit({
      latitude,
      longitude,
      start_year: startYear,
      end_year: endYear,
    });
  }
}
