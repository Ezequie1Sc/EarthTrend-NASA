
import {
  Component,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import {
  ClimateApiService,
} from '../../../../core/services/climate-api.service';

import type {
  ClimateQuery,
  TrendAnalysisResponse,
} from '../../../../core/models/climate.model';

import {
  EarthGlobe,
} from '../../components/earth-globe/earth-globe';

import {
  LocationSelector,
} from '../../../dashboard/components/location-selector/location-selector';

import type {
  SelectedCoordinates,
} from '../../../dashboard/components/location-selector/location-selector';

import {
  ClimateChart,
} from '../../../dashboard/components/climate-chart/climate-chart';

import {
  TrendSummary,
} from '../../../dashboard/components/trend-summary/trend-summary';

@Component({
  selector: 'app-earth-explorer',
  standalone: true,
  imports: [
    RouterLink,
    DecimalPipe,
    EarthGlobe,
    LocationSelector,
    ClimateChart,
    TrendSummary,
  ],
  template: `
    <main class="min-h-screen bg-[#030b19] text-white">

      <!-- HEADER -->
      <header class="border-b border-sky-900/60 bg-[#061225]">
        <div
          class="mx-auto flex max-w-[1800px]
                 flex-wrap items-center justify-between
                 gap-5 px-5 py-5 lg:px-8"
        >
          <div>
            <p
              class="text-xs font-medium uppercase
                     tracking-[0.24em] text-sky-400"
            >
              NASA Space Apps Challenge 2026
            </p>

            <h1 class="mt-2 text-2xl font-semibold">
              EarthTrend NASA
            </h1>

            <p class="mt-1 text-sm text-slate-400">
              Earth System Climate Explorer
            </p>
          </div>

          <nav
            class="flex flex-wrap items-center gap-3"
            aria-label="Main navigation"
          >
            <a
              routerLink="/explorer"
              class="rounded-xl border border-sky-500/70
                     bg-sky-950 px-4 py-2.5
                     text-sm font-medium text-sky-200"
            >
              Earth Explorer
            </a>

            <a
              routerLink="/"
              class="rounded-xl border border-slate-700
                     px-4 py-2.5 text-sm text-slate-300
                     transition hover:border-sky-500
                     hover:text-white"
            >
              Climate Dashboard
            </a>

            <button
              type="button"
              (click)="toggleImmersive()"
              class="rounded-xl bg-sky-600 px-4 py-2.5
                     text-sm font-medium transition
                     hover:bg-sky-500"
            >
              {{ immersive() ? 'Show panels' : 'Immersive view' }}
            </button>
          </nav>
        </div>
      </header>

      <!-- EARTH EXPLORER -->
      <section
        class="mx-auto max-w-[1800px]
               px-5 py-6 lg:px-8"
      >
        <div
          [class]="
            immersive()
              ? 'grid grid-cols-1 items-start gap-5'
              : 'grid grid-cols-1 items-start gap-5 xl:grid-cols-[300px_minmax(0,1fr)_280px]'
          "
        >

          <!-- LEFT SIDEBAR -->
          @if (!immersive()) {
            <aside class="min-w-0 space-y-5">

              <section
                class="rounded-2xl border border-sky-900/70
                       bg-[#091a30] p-5"
              >
                <div
                  class="mb-4 flex items-center
                         justify-between gap-3"
                >
                  <h2 class="text-lg font-semibold">
                    Earth Explorer
                  </h2>

                  <span
                    class="rounded-full border border-sky-700/60
                           bg-sky-950/80 px-2.5 py-1
                           text-xs text-sky-300"
                  >
                    3D
                  </span>
                </div>

                <p class="text-sm leading-6 text-slate-300">
                  Explore Earth's surface and select geographic
                  coordinates to investigate historical
                  temperature trends.
                </p>

                <div
                  class="mt-5 rounded-xl border
                         border-sky-900/60
                         bg-[#102743] p-4"
                >
                  <p
                    class="text-xs font-semibold uppercase
                           tracking-wider text-sky-300"
                  >
                    Geographic selection
                  </p>

                  @if (selectedCoordinates(); as location) {
                    <p class="mt-3 text-sm font-medium">
                      {{ location.latitude | number:'1.3-3' }}°,
                      {{ location.longitude | number:'1.3-3' }}°
                    </p>

                    <p class="mt-2 text-xs leading-5 text-slate-400">
                      Coordinates transferred to Climate Analysis.
                    </p>
                  } @else {
                    <p class="mt-3 text-sm leading-6 text-slate-300">
                      Double-click the globe to select a location,
                      or use the form below.
                    </p>
                  }
                </div>
              </section>

              <section
                class="rounded-2xl border border-sky-900/70
                       bg-[#091a30] p-5"
              >
                <h2 class="text-base font-semibold">
                  Data coverage
                </h2>

                <p class="mt-3 text-sm leading-6 text-slate-300">
                  NASA POWER provides annual temperature
                  observations for individual geographic coordinates.
                </p>

                <p class="mt-3 text-xs leading-5 text-slate-400">
                  The geographic Earth texture is not
                  a global temperature visualization.
                </p>
              </section>
            </aside>
          }

          <!-- 3D GLOBE -->
          <div
            class="relative min-w-0 overflow-hidden
                   rounded-2xl border border-sky-900/70
                   bg-[#020817]"
            [class]="
              immersive()
                ? 'relative min-w-0 min-h-[calc(100vh-150px)] overflow-hidden rounded-2xl border border-sky-900/70 bg-[#020817]'
                : 'relative min-w-0 min-h-[560px] overflow-hidden rounded-2xl border border-sky-900/70 bg-[#020817]'
            "
          >
            <app-earth-globe
              (locationSelected)="onLocationSelected($event)"
            />
          </div>

          <!-- RIGHT SIDEBAR -->
          @if (!immersive()) {
            <aside class="min-w-0 space-y-5">

              <section
                class="rounded-2xl border border-sky-900/70
                       bg-[#091a30] p-5"
              >
                <h2 class="text-lg font-semibold">
                  Display Options
                </h2>

                <div class="mt-5 space-y-4">
                  <div>
                    <p
                      class="text-xs uppercase tracking-wider
                             text-slate-400"
                    >
                      Visualization
                    </p>

                    <p class="mt-2 text-sm font-medium">
                      Interactive 3D Earth
                    </p>
                  </div>

                  <div class="border-t border-sky-900/60 pt-4">
                    <p
                      class="text-xs uppercase tracking-wider
                             text-slate-400"
                    >
                      Surface layer
                    </p>

                    <p class="mt-2 text-sm text-sky-300">
                      Geographic imagery
                    </p>
                  </div>

                  <div class="border-t border-sky-900/60 pt-4">
                    <p
                      class="text-xs uppercase tracking-wider
                             text-slate-400"
                    >
                      Temperature overlay
                    </p>

                    <p class="mt-2 text-sm text-slate-400">
                      Coming soon
                    </p>
                  </div>
                </div>
              </section>

              <section
                class="rounded-2xl border border-sky-900/70
                       bg-[#091a30] p-5"
              >
                <h2 class="text-lg font-semibold">
                  Data Source
                </h2>

                <p class="mt-4 text-sm font-semibold text-sky-300">
                  NASA POWER
                </p>

                <p class="mt-2 text-xs leading-6 text-slate-400">
                  Climate observations are retrieved through
                  the EarthTrend NASA FastAPI backend.
                </p>
              </section>

              @if (analysis(); as result) {
                <section
                  class="rounded-2xl border border-sky-900/70
                         bg-[#091a30] p-5"
                >
                  <h2 class="text-lg font-semibold">
                    Latest analysis
                  </h2>

                  <p
                    class="mt-4 text-xs uppercase
                           tracking-wider text-slate-400"
                  >
                    Temperature trend
                  </p>

                  <p class="mt-2 text-2xl font-semibold text-sky-300">
                    {{
                      result.slope_celsius_per_decade
                        | number:'1.2-3'
                    }}
                    <span class="text-sm font-normal text-slate-300">
                      °C/decade
                    </span>
                  </p>

                  <p class="mt-3 text-sm capitalize text-slate-300">
                    {{ result.trend }}
                  </p>
                </section>
              }
            </aside>
          }
        </div>
      </section>

      <!-- CLIMATE ANALYSIS -->
      @if (!immersive()) {
        <section
          id="climate-analysis"
          class="mx-auto max-w-[1800px]
                 px-5 pb-12 lg:px-8"
        >
          <div
            class="mb-6 flex flex-wrap items-end
                   justify-between gap-4"
          >
            <div>
              <p
                class="text-xs font-semibold uppercase
                       tracking-[0.2em] text-sky-400"
              >
                Scientific workspace
              </p>

              <h2 class="mt-2 text-2xl font-semibold">
                Climate Analysis
              </h2>

              <p
                class="mt-2 max-w-2xl text-sm
                       leading-6 text-slate-400"
              >
                Investigate historical annual temperature
                observations and linear trends for
                a selected location.
              </p>
            </div>

            <span
              class="rounded-full border border-sky-900/70
                     bg-[#091a30] px-4 py-2
                     text-xs text-sky-300"
            >
              NASA POWER · Annual observations
            </span>
          </div>

          <!--
            NORMAL:
              360px form + flexible chart

            EXPANDED:
              One full-width column.
              Chart first, horizontal form second.
          -->
          <div
            [class]="
              chartExpanded()
                ? 'grid w-full min-w-0 grid-cols-1 items-start gap-5'
                : 'grid w-full min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-[360px_minmax(0,1fr)]'
            "
          >

            <!-- FORM: NEVER DESTROYED -->
            <div
              [class]="
                chartExpanded()
                  ? 'order-2 col-span-full w-full min-w-0'
                  : 'order-1 w-full min-w-0'
              "
            >
              <app-location-selector
                [coordinates]="selectedCoordinates()"
                [horizontal]="chartExpanded()"
                (analyze)="analyzeClimate($event)"
              />
            </div>

            <!-- CHART -->
            <div
              [class]="
                chartExpanded()
                  ? 'order-1 col-span-full w-full min-w-0'
                  : 'order-2 w-full min-w-0'
              "
            >
              @if (loading()) {
                <div
                  role="status"
                  aria-live="polite"
                  class="flex min-h-[360px] flex-col
                         items-center justify-center
                         rounded-2xl border border-sky-900/70
                         bg-[#091a30] p-8 text-center"
                >
                  <div
                    class="h-10 w-10 animate-spin
                           rounded-full border-4
                           border-sky-950 border-t-sky-400"
                  ></div>

                  <h3 class="mt-6 text-lg font-semibold">
                    Analyzing climate data
                  </h3>

                  <p class="mt-3 max-w-md text-sm text-slate-400">
                    Retrieving NASA POWER observations
                    and calculating statistical trends.
                  </p>
                </div>

              } @else if (error()) {
                <div
                  role="alert"
                  class="rounded-2xl border border-red-900/60
                         bg-[#091a30] p-8"
                >
                  <h3 class="text-lg font-semibold text-red-300">
                    Analysis unavailable
                  </h3>

                  <p class="mt-3 text-sm text-slate-300">
                    {{ error() }}
                  </p>

                  <p class="mt-4 text-xs text-slate-400">
                    Check that the FastAPI backend is running.
                  </p>
                </div>

              } @else if (analysis(); as result) {
                <app-climate-chart
                  [data]="result"
                  [expanded]="chartExpanded()"
                  (expandedChange)="chartExpanded.set($event)"
                />

              } @else {
                <div
                  class="flex min-h-[360px] flex-col
                         items-center justify-center
                         rounded-2xl border border-dashed
                         border-sky-900/80 bg-[#091a30]
                         p-8 text-center"
                >
                  <div
                    class="flex h-16 w-16 items-center
                           justify-center rounded-2xl
                           border border-sky-800 bg-sky-950/70"
                  >
                    <span class="text-xl font-semibold text-sky-300">
                      ET
                    </span>
                  </div>

                  <h3 class="mt-6 text-xl font-semibold">
                    Discover climate trends
                  </h3>

                  <p
                    class="mt-3 max-w-md text-sm
                           leading-6 text-slate-400"
                  >
                    Select a location and historical period,
                    then run the analysis to visualize
                    real temperature data.
                  </p>
                </div>
              }
            </div>
          </div>

          <!-- CLIMATE INSIGHTS -->
          @if (analysis(); as result) {
            <section class="mt-8">
              <div class="mb-5">
                <p
                  class="text-xs font-semibold uppercase
                         tracking-[0.2em] text-sky-400"
                >
                  Statistical interpretation
                </p>

                <h2 class="mt-2 text-2xl font-semibold">
                  Climate Insights
                </h2>

                <p class="mt-2 text-sm text-slate-400">
                  Linear regression results for
                  {{ result.start_year }}–{{ result.end_year }}
                </p>
              </div>

              <app-trend-summary [data]="result" />

              <div
                class="mt-5 rounded-2xl border
                       border-sky-900/70 bg-[#091a30] p-6"
              >
                <h3 class="text-lg font-semibold">
                  Understanding the results
                </h3>

                <p class="mt-3 text-sm leading-7 text-slate-300">
                  NASA POWER annual temperature observations
                  are evaluated using linear regression.
                  The estimated slope describes the temperature
                  change per decade.
                </p>

                <p class="mt-3 text-sm leading-7 text-slate-300">
                  R² describes the proportion of observed
                  variation explained by the linear model.
                  Statistical significance is evaluated
                  using the p-value.
                </p>

                @if (result.significant) {
                  <p
                    class="mt-4 rounded-xl border
                           border-sky-800/60 bg-sky-950/50
                           p-4 text-sm leading-6 text-sky-200"
                  >
                    The estimated linear trend is statistically
                    significant at the 0.05 threshold.
                  </p>
                } @else {
                  <p
                    class="mt-4 rounded-xl border border-slate-700
                           bg-slate-900/70 p-4
                           text-sm leading-6 text-slate-300"
                  >
                    No statistically significant linear trend
                    was detected for the selected period.
                    This does not establish that temperatures
                    are stable.
                  </p>
                }
              </div>
            </section>
          }
        </section>
      }

      <!-- FOOTER -->
      @if (!immersive()) {
        <footer class="border-t border-sky-900/60 bg-[#061225]">
          <div
            class="mx-auto max-w-[1800px]
                   px-5 py-6 text-xs text-slate-400 lg:px-8"
          >
            EarthTrend NASA · NASA Space Apps Challenge 2026
          </div>
        </footer>
      }
    </main>
  `,
})
export class EarthExplorer {
  private readonly climateApi = inject(ClimateApiService);

  readonly immersive = signal(false);
  readonly chartExpanded = signal(false);

  readonly selectedCoordinates =
    signal<SelectedCoordinates | null>(null);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly analysis =
    signal<TrendAnalysisResponse | null>(null);

  private requestVersion = 0;

  toggleImmersive(): void {
    this.immersive.update(value => !value);
  }

  onLocationSelected(
    location: SelectedCoordinates,
  ): void {
    if (
      !Number.isFinite(location.latitude) ||
      !Number.isFinite(location.longitude) ||
      location.latitude < -90 ||
      location.latitude > 90 ||
      location.longitude < -180 ||
      location.longitude > 180
    ) {
      return;
    }

    // Invalidate any pending request for a previous location.
    this.requestVersion++;

    this.selectedCoordinates.set({
      latitude: location.latitude,
      longitude: location.longitude,
    });

    this.loading.set(false);
    this.analysis.set(null);
    this.error.set(null);
  }

  analyzeClimate(query: ClimateQuery): void {
    const version = ++this.requestVersion;

    this.loading.set(true);
    this.error.set(null);
    this.analysis.set(null);

    forkJoin({
      temperature: this.climateApi.getTemperatures(query),
      analysis: this.climateApi.getTrendAnalysis(query),
    })
      .pipe(
        finalize(() => {
          if (version === this.requestVersion) {
            this.loading.set(false);
          }
        }),
      )
      .subscribe({
        next: ({ analysis }) => {
          if (version !== this.requestVersion) {
            return;
          }

          this.analysis.set(analysis);
        },

        error: (error: unknown) => {
          if (version !== this.requestVersion) {
            return;
          }

          this.error.set(this.getErrorMessage(error));
        },
      });
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Unable to connect to the climate API. Verify that the FastAPI backend is running.';
      }

      if (error.status === 422) {
        return 'The selected coordinates or historical period are not valid.';
      }

      if (error.status === 502) {
        return 'NASA POWER is temporarily unavailable. Please try again later.';
      }

      return `The climate API returned an error (${error.status}).`;
    }

    return 'An unexpected error occurred during climate analysis.';
  }
}
