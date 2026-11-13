
import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
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
    RouterLink,
    ClimateChart,
    LocationSelector,
    TrendSummary,
  ],
  template: `
    <main
      class="min-h-screen bg-[#030b19] text-white"
      aria-label="EarthTrend NASA climate dashboard"
    >
      <!-- HEADER -->
      <header class="border-b border-sky-900/60 bg-[#061225]">
        <div
          class="mx-auto flex max-w-[1800px] flex-wrap items-center
                 justify-between gap-5 px-5 py-5 lg:px-8"
        >
          <!-- NASA BRAND -->
          <div class="flex min-w-0 items-center gap-4 sm:gap-5">
            <img
              src="/logo/nasa-logo.webp"
              alt="NASA emblem"
              width="80"
              height="80"
              class="h-16 w-16 shrink-0 rounded-full object-cover
                     ring-1 ring-white/15 sm:h-20 sm:w-20"
            />

            <div class="min-w-0">
              <p
                class="text-[10px] font-semibold uppercase
                       tracking-[0.23em] text-sky-400 sm:text-xs"
              >
                NASA Space Apps Challenge 2026
              </p>

              <h1
                class="mt-1.5 text-2xl font-black uppercase
                       leading-none tracking-[0.13em] text-white
                       sm:text-3xl lg:text-[34px]"
                style="font-family: 'Arial Black', 'Arial', sans-serif"
              >
                EarthTrend
                <span class="text-sky-400">NASA</span>
              </h1>

              <p
                class="mt-2 text-[11px] font-medium uppercase
                       tracking-[0.18em] text-slate-400 sm:text-xs"
              >
                Climate Intelligence Dashboard
              </p>
            </div>
          </div>

          <!-- NAVIGATION -->
          <nav
            class="flex flex-wrap items-center gap-3"
            aria-label="Main navigation"
          >
            <a
              routerLink="/"
              aria-current="page"
              class="rounded-xl border border-sky-500/70
                     bg-sky-950 px-4 py-2.5 text-sm
                     font-medium text-sky-200"
            >
              Climate Dashboard
            </a>

            <a
              routerLink="/explorer"
              class="rounded-xl border border-slate-700
                     px-4 py-2.5 text-sm text-slate-300
                     transition hover:border-sky-500
                     hover:text-white"
            >
              Earth Explorer
            </a>
          </nav>
        </div>
      </header>

      <!-- MAIN CONTENT -->
      <div class="mx-auto max-w-[1800px] px-5 py-8 lg:px-8">

        <!-- INTRODUCTION -->
        <section
          class="mb-8 flex flex-wrap items-end
                 justify-between gap-5"
          aria-labelledby="dashboard-heading"
        >
          <div>
            <p
              class="text-xs font-semibold uppercase
                     tracking-[0.2em] text-sky-400"
            >
              Scientific workspace
            </p>

            <h2
              id="dashboard-heading"
              class="mt-2 text-3xl font-semibold
                     tracking-tight text-white"
            >
              Climate Analysis
            </h2>

            <p
              class="mt-3 max-w-2xl text-sm
                     leading-6 text-slate-400"
            >
              Explore historical temperature observations
              and investigate climate trends using NASA POWER
              data and statistical analysis.
            </p>
          </div>

          <!-- DATA PROVIDER -->
          <div
            class="flex items-center gap-3 rounded-xl
                   border border-sky-900/70
                   bg-[#091a30] px-4 py-3"
          >
            <div
              class="flex h-10 w-10 items-center
                     justify-center rounded-lg
                     border border-sky-800/60
                     bg-sky-950/60 text-sky-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18" />
                <path d="M12 3a15 15 0 0 1 0 18" />
                <path d="M12 3a15 15 0 0 0 0 18" />
              </svg>
            </div>

            <div>
              <p class="text-xs text-slate-400">
                Data provider
              </p>
              <p class="mt-1 text-sm font-semibold text-white">
                NASA POWER
              </p>
            </div>
          </div>
        </section>

        <!-- DASHBOARD GRID -->
        <div
          [class]="
            chartExpanded()
              ? 'grid w-full min-w-0 grid-cols-1 items-start gap-5'
              : 'grid w-full min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-[360px_minmax(0,1fr)]'
          "
        >
          <!-- LOCATION SELECTOR -->
          <div
            [class]="
              chartExpanded()
                ? 'order-2 col-span-full w-full min-w-0'
                : 'order-1 w-full min-w-0'
            "
          >
            <app-location-selector
              [horizontal]="chartExpanded()"
              (analyze)="analyzeClimate($event)"
            />
          </div>

          <!-- CHART AND STATUS -->
          <section
            [class]="
              chartExpanded()
                ? 'order-1 col-span-full w-full min-w-0'
                : 'order-2 w-full min-w-0'
            "
            aria-label="Climate analysis results"
          >
            @if (loading()) {
              <!-- LOADING -->
              <div
                role="status"
                aria-live="polite"
                class="flex min-h-[360px] flex-col
                       items-center justify-center
                       rounded-2xl border border-sky-900/70
                       bg-[#091a30] p-8 text-center"
              >
                <div
                  class="h-11 w-11 animate-spin rounded-full
                         border-4 border-sky-950 border-t-sky-400"
                ></div>

                <h3 class="mt-6 text-lg font-semibold text-white">
                  Analyzing climate data
                </h3>

                <p
                  class="mt-3 max-w-md text-sm leading-6
                         text-slate-400"
                >
                  Retrieving NASA POWER observations and
                  calculating statistical temperature trends.
                </p>
              </div>
            } @else if (error()) {
              <!-- ERROR -->
              <div
                role="alert"
                class="rounded-2xl border border-red-900/60
                       bg-[#091a30] p-8"
              >
                <div
                  class="mb-4 flex h-12 w-12 items-center
                         justify-center rounded-xl
                         bg-red-500/10 text-red-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 7v6" />
                    <path d="M12 17h.01" />
                  </svg>
                </div>

                <h3 class="text-lg font-semibold text-red-300">
                  Analysis unavailable
                </h3>

                <p class="mt-3 text-sm leading-6 text-slate-300">
                  {{ error() }}
                </p>

                <p class="mt-4 text-xs text-slate-400">
                  Check that the FastAPI backend is running
                  and try again.
                </p>
              </div>
            } @else if (analysis(); as result) {
              <!-- CHART -->
              <app-climate-chart
                [data]="result"
                [expanded]="chartExpanded()"
                (expandedChange)="chartExpanded.set($event)"
              />
            } @else {
              <!-- EMPTY STATE -->
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="text-sky-300"
                    aria-hidden="true"
                  >
                    <path d="M3 3v18h18" />
                    <path d="m7 16 4-5 4 3 5-7" />
                    <path d="M16 7h4v4" />
                  </svg>
                </div>

                <h3 class="mt-6 text-xl font-semibold text-white">
                  Discover climate trends
                </h3>

                <p
                  class="mt-3 max-w-md text-sm
                         leading-6 text-slate-400"
                >
                  Select a location and historical period,
                  then run an analysis to visualize real
                  NASA POWER temperature observations.
                </p>

                <div
                  class="mt-6 flex flex-wrap items-center
                         justify-center gap-2"
                >
                  <span
                    class="rounded-full border border-sky-800/60
                           bg-sky-950/50 px-3 py-1.5
                           text-xs text-sky-300"
                  >
                    Historical observations
                  </span>

                  <span
                    class="rounded-full border border-sky-800/60
                           bg-sky-950/50 px-3 py-1.5
                           text-xs text-sky-300"
                  >
                    Linear regression
                  </span>
                </div>
              </div>
            }
          </section>
        </div>

        <!-- CLIMATE INSIGHTS -->
        @if (analysis(); as result) {
          <section
            class="mt-9"
            aria-labelledby="dashboard-insights-heading"
          >
            <div class="mb-5">
              <p
                class="text-xs font-semibold uppercase
                       tracking-[0.2em] text-sky-400"
              >
                Statistical interpretation
              </p>

              <h2
                id="dashboard-insights-heading"
                class="mt-2 text-2xl font-semibold text-white"
              >
                Climate Insights
              </h2>

              <p class="mt-2 text-sm text-slate-400">
                Linear regression results for
                {{ result.start_year }}–{{ result.end_year }}
              </p>
            </div>

            <!-- STATISTIC CARDS -->
            <app-trend-summary [data]="result" />

            <!-- ANALYSIS EXPLANATION -->
            <section
              class="mt-6 rounded-2xl border
                     border-sky-900/70 bg-[#091a30] p-6"
              aria-labelledby="understanding-results-heading"
            >
              <div class="flex items-start gap-4">
                <div
                  class="flex h-11 w-11 shrink-0
                         items-center justify-center
                         rounded-xl border border-sky-800/60
                         bg-sky-950/60 text-sky-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 11v6" />
                    <path d="M12 7h.01" />
                  </svg>
                </div>

                <div class="min-w-0">
                  <h3
                    id="understanding-results-heading"
                    class="text-lg font-semibold text-white"
                  >
                    Understanding the results
                  </h3>

                  <p class="mt-3 text-sm leading-7 text-slate-300">
                    NASA POWER annual temperature observations
                    are evaluated using linear regression.
                    The estimated slope describes the direction
                    and magnitude of temperature change per decade.
                  </p>

                  <p class="mt-3 text-sm leading-7 text-slate-300">
                    The R² coefficient indicates the proportion
                    of observed variation explained by the
                    linear model. Statistical significance
                    is evaluated using a p-value threshold
                    of 0.05.
                  </p>

                  @if (result.significant) {
                    <div
                      class="mt-5 flex items-start gap-3
                             rounded-xl border border-cyan-800/50
                             bg-cyan-950/30 p-4"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="mt-0.5 shrink-0 text-cyan-300"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="m8 12 3 3 5-6" />
                      </svg>

                      <p class="text-sm leading-6 text-cyan-200">
                        The estimated linear trend is
                        statistically significant at the
                        0.05 threshold.
                      </p>
                    </div>
                  } @else {
                    <div
                      class="mt-5 flex items-start gap-3
                             rounded-xl border border-amber-900/50
                             bg-amber-950/20 p-4"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="mt-0.5 shrink-0 text-amber-300"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 7v6" />
                        <path d="M12 17h.01" />
                      </svg>

                      <p class="text-sm leading-6 text-amber-200">
                        No statistically significant linear
                        trend was detected for the selected
                        period. This does not establish
                        that temperatures are stable.
                      </p>
                    </div>
                  }
                </div>
              </div>
            </section>
          </section>
        }

        <!-- FOOTER -->
        <footer
          class="mt-12 border-t border-sky-900/60 pt-6 pb-3"
        >
          <div
            class="flex flex-wrap items-center
                   justify-between gap-3"
          >
            <p class="text-xs text-slate-500">
              EarthTrend NASA · NASA Space Apps Challenge 2026
            </p>

            <p class="text-xs text-slate-500">
              Climate data provided by NASA POWER
            </p>
          </div>
        </footer>
      </div>
    </main>
  `,
})
export class Dashboard {
  private readonly climateApi = inject(ClimateApiService);

  /**
   * false: form on left, chart on right.
   * true: chart full width, horizontal form below.
   */
  readonly chartExpanded = signal(false);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly analysis =
    signal<TrendAnalysisResponse | null>(null);

  private requestVersion = 0;

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
