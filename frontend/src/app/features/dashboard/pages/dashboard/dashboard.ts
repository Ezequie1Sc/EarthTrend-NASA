
import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, forkJoin } from 'rxjs';

import { ClimateApiService } from '../../../../core/services/climate-api.service';
import type {
  ClimateQuery,
  TrendAnalysisResponse,
} from '../../../../core/models/climate.model';

import { ClimateChart } from '../../components/climate-chart/climate-chart';
import { LocationSelector } from '../../components/location-selector/location-selector';
import { TrendSummary } from '../../components/trend-summary/trend-summary';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    ClimateChart,
    LocationSelector,
    TrendSummary,
  ],
  template: `
    <main class="min-h-screen bg-slate-50 text-slate-900">
      <div class="mx-auto max-w-7xl px-5 py-8 lg:px-8">

        <!-- Header -->
        <header class="mb-10 border-b border-slate-200 pb-7">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p class="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                NASA Space Apps Challenge 2026
              </p>

              <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">
                EarthTrend NASA
              </h1>

              <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Explore historical temperature observations and investigate
                climate trends using NASA POWER data and statistical analysis.
              </p>
            </div>

            <div class="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p class="text-xs text-slate-400">Data provider</p>
              <p class="mt-1 text-sm font-semibold">NASA POWER</p>
            </div>
          </div>
        </header>

        <!-- Exploration -->
        <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">

          <div class="lg:col-span-1">
            <app-location-selector
              (analyze)="analyzeClimate($event)"
            />
          </div>

          <section class="lg:col-span-2">

            @if (loading()) {
              <div
                role="status"
                aria-live="polite"
                class="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8"
              >
                <div
                  class="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"
                ></div>

                <h2 class="mt-5 text-lg font-semibold">
                  Analyzing climate data
                </h2>

                <p class="mt-2 text-center text-sm text-slate-500">
                  Retrieving observations and calculating statistical trends.
                </p>
              </div>

            } @else if (error()) {
              <div
                role="alert"
                class="rounded-2xl border border-red-200 bg-white p-8"
              >
                <h2 class="text-lg font-semibold text-red-700">
                  Analysis unavailable
                </h2>

                <p class="mt-3 text-sm leading-6 text-slate-600">
                  {{ error() }}
                </p>

                <p class="mt-4 text-xs text-slate-500">
                  Check that the FastAPI backend is running and try again.
                </p>
              </div>

            } @else if (analysis()) {
              <app-climate-chart [data]="analysis()!" />

            } @else {
              <div
                class="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"
              >
                <div class="mb-5 rounded-2xl bg-blue-50 p-4">
                  <span class="text-2xl font-bold text-blue-600">
                    ET
                  </span>
                </div>

                <h2 class="text-xl font-semibold">
                  Discover climate trends
                </h2>

                <p class="mt-3 max-w-md text-sm leading-6 text-slate-500">
                  Select a location and a historical period, then click
                  Analyze climate trends to explore NASA temperature data.
                </p>
              </div>
            }

          </section>
        </div>

        <!-- Statistical results -->
        @if (analysis(); as result) {
          <section class="mt-8">
            <div class="mb-5">
              <h2 class="text-xl font-semibold">
                Statistical insights
              </h2>

              <p class="mt-1 text-sm text-slate-500">
                Linear regression results for
                {{ result.start_year }}–{{ result.end_year }}
              </p>
            </div>

            <app-trend-summary [data]="result" />
          </section>

          <section class="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 class="text-lg font-semibold">
              About this analysis
            </h2>

            <p class="mt-3 text-sm leading-7 text-slate-600">
              The analysis uses annual temperature observations provided by
              NASA POWER. A linear regression model estimates the direction
              and magnitude of the temperature trend over the selected period.
              Statistical significance is evaluated using a p-value threshold
              of 0.05.
            </p>

            <p class="mt-3 text-sm leading-7 text-slate-600">
              A non-significant result does not establish that temperatures
              are stable. It means that this analysis did not detect a
              statistically significant linear trend for the selected data.
            </p>
          </section>
        }

        <!-- Footer -->
        <footer class="mt-12 border-t border-slate-200 pt-6 text-xs text-slate-400">
          EarthTrend NASA · NASA Space Apps Challenge 2026
        </footer>

      </div>
    </main>
  `,
})
export class Dashboard {
  private readonly climateApi = inject(ClimateApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly analysis = signal<TrendAnalysisResponse | null>(null);

  analyzeClimate(query: ClimateQuery): void {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.analysis.set(null);

    forkJoin({
      temperature: this.climateApi.getTemperatures(query),
      analysis: this.climateApi.getTrendAnalysis(query),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: ({ analysis }) => {
          this.analysis.set(analysis);
        },
        error: (error: unknown) => {
          this.error.set(this.getErrorMessage(error));
        },
      });
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Unable to connect to the climate API.';
      }

      if (error.status === 422) {
        return 'The selected coordinates or period are not valid.';
      }

      if (error.status === 502) {
        return 'NASA POWER is temporarily unavailable.';
      }

      return `The climate API returned an error (${error.status}).`;
    }

    return 'An unexpected error occurred during climate analysis.';
  }
}
