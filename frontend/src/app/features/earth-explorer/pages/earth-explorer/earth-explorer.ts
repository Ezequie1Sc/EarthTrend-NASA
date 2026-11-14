
import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import { ClimateApiService } from '../../../../core/services/climate-api.service';

import type {
  ClimateQuery,
  TrendAnalysisResponse,
} from '../../../../core/models/climate.model';

import { EarthGlobe } from '../../components/earth-globe/earth-globe';

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

  styles: [`
    :host {
      display: block;
      background: #030b19;
    }

    /* ==========================================
       MINIMAL NASA FOOTER
       ========================================== */

    .nasa-footer {
      background: #06111f;
      border-top: 1px solid rgba(148, 163, 184, 0.12);
      color: #f8fafc;
    }

    .nasa-footer-container {
      width: 100%;
      max-width: 1800px;
      margin: 0 auto;
      padding: 60px clamp(24px, 4vw, 64px) 28px;
    }

    .nasa-footer-main {
      display: grid;
      grid-template-columns:
        minmax(0, 1.5fr)
        repeat(2, minmax(0, 0.7fr));
      gap: clamp(35px, 5vw, 90px);
      padding-bottom: 55px;
    }

    /* BRAND */

    .nasa-footer-brand {
      max-width: 460px;
    }

    .nasa-footer-identity {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .nasa-footer-logo {
      width: 58px;
      height: 58px;
      flex-shrink: 0;
      border-radius: 50%;
      object-fit: contain;
    }

    .nasa-footer-title {
      margin: 0;
      font-family: 'Arial Black', Arial, sans-serif;
      font-size: clamp(19px, 2vw, 25px);
      font-weight: 900;
      line-height: 1.15;
      letter-spacing: -0.035em;
      color: #f8fafc;
    }

    .nasa-footer-title span {
      color: #a6cfe7;
    }

    .nasa-footer-subtitle {
      margin: 7px 0 0;
      color: #8298ad;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.15em;
      text-transform: uppercase;
    }

    .nasa-footer-description {
      max-width: 410px;
      margin: 24px 0 0;
      color: #94a3b8;
      font-size: 13px;
      line-height: 1.9;
    }

    /* NAVIGATION */

    .nasa-footer-column h3 {
      margin: 0 0 24px;
      color: #e2e8f0;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    .nasa-footer-column nav {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 17px;
    }

    .nasa-footer-column nav a {
      color: #94a3b8;
      font-size: 13px;
      line-height: 1.5;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .nasa-footer-column nav a:hover {
      color: #e0f2fe;
    }

    .nasa-footer-column nav a:focus-visible,
    .nasa-footer-developer:focus-visible {
      outline: 2px solid #7dd3fc;
      outline-offset: 5px;
      border-radius: 3px;
    }

    /* BOTTOM */

    .nasa-footer-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 20px;
      padding-top: 26px;
      border-top: 1px solid rgba(148, 163, 184, 0.12);
    }

    .nasa-footer-copyright {
      margin: 0;
      color: #8192a6;
      font-size: 12px;
      line-height: 1.6;
    }

    .nasa-footer-developer {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #94a3b8;
      font-size: 12px;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .nasa-footer-developer:hover {
      color: #f8fafc;
    }

    .nasa-footer-developer strong {
      color: #e2e8f0;
      font-weight: 600;
    }

    .nasa-footer-developer svg {
      width: 17px;
      height: 17px;
      flex-shrink: 0;
    }

    .nasa-footer-disclaimer {
      max-width: 900px;
      margin: 18px 0 0;
      color: #65788e;
      font-size: 11px;
      line-height: 1.8;
    }

    /* RESPONSIVE */

    @media (max-width: 900px) {
      .nasa-footer-main {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 42px;
      }

      .nasa-footer-brand {
        grid-column: 1 / -1;
      }
    }

    @media (max-width: 520px) {
      .nasa-footer-container {
        padding: 45px 22px 25px;
      }

      .nasa-footer-main {
        grid-template-columns: 1fr;
        gap: 38px;
        padding-bottom: 40px;
      }

      .nasa-footer-brand {
        grid-column: auto;
      }

      .nasa-footer-logo {
        width: 52px;
        height: 52px;
      }

      .nasa-footer-title {
        font-size: 21px;
      }

      .nasa-footer-bottom {
        align-items: flex-start;
        flex-direction: column;
        gap: 12px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .nasa-footer-column nav a,
      .nasa-footer-developer {
        transition: none;
      }
    }
  `],

  template: `
    <main
      class="min-h-screen bg-[#030b19] text-white"
      aria-label="EarthTrend NASA Earth Explorer"
    >

      <!-- ======================================
           HEADER
           ====================================== -->

      <header class="border-b border-sky-900/60 bg-[#061225]">
        <div
          class="mx-auto flex max-w-[1800px] flex-wrap
                 items-center justify-between gap-5 px-5 py-5 lg:px-8"
        >
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
                style="font-family: 'Arial Black', Arial, sans-serif"
              >
                EarthTrend <span class="text-sky-400">NASA</span>
              </h1>

              <p
                class="mt-2 text-[11px] font-medium uppercase
                       tracking-[0.18em] text-slate-400 sm:text-xs"
              >
                Earth System Climate Explorer
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
                     bg-sky-950 px-4 py-2.5
                     text-sm font-medium text-sky-200"
            >
              Earth Explorer
            </a>

            <a
              routerLink="/dashboard"
              class="rounded-xl border border-slate-700
                     px-4 py-2.5 text-sm text-slate-300
                     transition hover:border-sky-500 hover:text-white"
            >
              Climate Dashboard
            </a>

            <button
              type="button"
              (click)="toggleImmersive()"
              [attr.aria-pressed]="immersive()"
              aria-label="Toggle immersive Earth visualization"
              class="rounded-xl bg-sky-600 px-4 py-2.5
                     text-sm font-medium transition
                     hover:bg-sky-500
                     focus-visible:outline-2
                     focus-visible:outline-offset-2
                     focus-visible:outline-sky-400"
            >
              {{ immersive() ? 'Show panels' : 'Immersive view' }}
            </button>
          </nav>
        </div>
      </header>

      <!-- ======================================
           EARTH EXPLORER
           ====================================== -->

      <section
        aria-label="Interactive Earth visualization"
        class="mx-auto max-w-[1800px] px-5 py-6 lg:px-8"
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
                  class="mb-4 flex items-center justify-between gap-3"
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
                  class="mt-5 rounded-xl border border-sky-900/60
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
                  NOAA provides global daily air temperature at 2 m.
                  NASA MERRA-2 is available after importing
                  authenticated downloads.
                </p>

                <p class="mt-3 text-xs leading-5 text-slate-400">
                  The thermal layer uses a complete reanalysis grid.
                  It is independent of the point-based
                  historical analysis.
                </p>
              </section>
            </aside>
          }

          <!-- ======================================
               INTERACTIVE 3D GLOBE
               ====================================== -->

          <div
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
                      Global daily mean · available
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
                  Global map: NOAA / NCEP–NCAR or imported MERRA-2.
                  Historical coordinate analysis: NASA POWER.
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

      <!-- ======================================
           CLIMATE ANALYSIS
           ====================================== -->

      @if (!immersive()) {
        <section
          id="climate-analysis"
          aria-labelledby="climate-analysis-heading"
          class="mx-auto max-w-[1800px] px-5 pb-12 lg:px-8"
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

              <h2
                id="climate-analysis-heading"
                class="mt-2 text-2xl font-semibold"
              >
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

          <!-- ANALYSIS GRID -->
          <div
            [class]="
              chartExpanded()
                ? 'grid w-full min-w-0 grid-cols-1 items-start gap-5'
                : 'grid w-full min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-[360px_minmax(0,1fr)]'
            "
          >

            <!-- LOCATION FORM -->
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

            <!-- ANALYSIS CHART -->
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
            <section
              class="mt-8"
              aria-labelledby="climate-insights-heading"
            >
              <div class="mb-5">
                <p
                  class="text-xs font-semibold uppercase
                         tracking-[0.2em] text-sky-400"
                >
                  Statistical interpretation
                </p>

                <h2
                  id="climate-insights-heading"
                  class="mt-2 text-2xl font-semibold"
                >
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

      <!-- ======================================
           MINIMAL NASA FOOTER
           ====================================== -->

      @if (!immersive()) {
        <footer
          class="nasa-footer"
          aria-label="EarthTrend NASA footer"
        >
          <div class="nasa-footer-container">

            <div class="nasa-footer-main">

              <!-- BRAND -->
              <div class="nasa-footer-brand">
                <div class="nasa-footer-identity">
                  <img
                    src="/logo/nasa-logo.webp"
                    alt="NASA emblem"
                    width="58"
                    height="58"
                    loading="lazy"
                    class="nasa-footer-logo"
                  />

                  <div>
                    <h2 class="nasa-footer-title">
                      EARTHTREND <span>NASA</span>
                    </h2>

                    <p class="nasa-footer-subtitle">
                      Climate Intelligence Platform
                    </p>
                  </div>
                </div>

                <p class="nasa-footer-description">
                  Exploring Earth's climate through scientific data,
                  interactive visualization and historical analysis.
                </p>
              </div>

              <!-- EXPLORE -->
              <div class="nasa-footer-column">
                <h3>Explore</h3>

                <nav aria-label="Explore EarthTrend NASA">
                  <a routerLink="/">
                    Earth Explorer
                  </a>

                  <a routerLink="/dashboard">
                    Climate Dashboard
                  </a>

                  <a
                    href="https://github.com/Ezequie1Sc/EarthTrend-NASA"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Source Code
                  </a>
                </nav>
              </div>

              <!-- RESOURCES -->
              <div class="nasa-footer-column">
                <h3>Resources</h3>

                <nav aria-label="NASA scientific resources">
                  <a
                    href="https://www.nasa.gov/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    NASA
                  </a>

                  <a
                    href="https://power.larc.nasa.gov/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    NASA POWER
                  </a>

                  <a
                    href="https://science.nasa.gov/earth/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Earth Science
                  </a>

                  <a
                    href="https://www.spaceappschallenge.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Space Apps Challenge
                  </a>
                </nav>
              </div>
            </div>

            <!-- BOTTOM -->
            <div class="nasa-footer-bottom">
              <p class="nasa-footer-copyright">
                © 2026 EarthTrend NASA. All rights reserved.
              </p>

              <a
                href="https://github.com/Ezequie1Sc"
                target="_blank"
                rel="noopener noreferrer"
                class="nasa-footer-developer"
                aria-label="Visit Ezequie1Sc on GitHub"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    d="M12 2C6.477 2 2 6.477 2 12c0 4.418
                       2.865 8.166 6.839 9.49.5.092.682-.217
                       .682-.482 0-.237-.009-.866-.014-1.7
                       -2.782.604-3.369-1.34-3.369-1.34
                       -.455-1.156-1.11-1.464-1.11-1.464
                       -.908-.62.069-.608.069-.608
                       1.003.07 1.53 1.03 1.53 1.03
                       .892 1.529 2.341 1.087 2.91.831
                       .091-.646.35-1.087.636-1.337
                       -2.22-.253-4.555-1.11-4.555-4.944
                       0-1.092.39-1.984 1.029-2.683
                       -.103-.253-.446-1.27.098-2.647
                       0 0 .84-.269 2.75 1.025
                       A9.564 9.564 0 0 1 12 6.836
                       c.85.004 1.705.115 2.504.337
                       1.909-1.294 2.747-1.025 2.747-1.025
                       .546 1.377.203 2.394.1 2.647
                       .64.699 1.028 1.591 1.028 2.683
                       0 3.844-2.339 4.688-4.566 4.936
                       .359.31.678.921.678 1.856
                       0 1.34-.012 2.421-.012 2.751
                       0 .267.18.578.688.48
                       C19.138 20.163 22 16.417 22 12
                       c0-5.523-4.477-10-10-10Z"
                  />
                </svg>

                <span>
                  Developed by <strong>@Ezequie1Sc</strong>
                </span>
              </a>
            </div>

            <!-- DISCLAIMER -->
            <p class="nasa-footer-disclaimer">
              EarthTrend NASA is an independent educational
              and scientific visualization project.
              It is not affiliated with or officially endorsed
              by NASA. Scientific datasets remain attributed
              to their respective providers.
            </p>

          </div>
        </footer>
      }

    </main>
  `,
})
export class EarthExplorer {
  private readonly climateApi = inject(ClimateApiService);

  // Start with the side panels visible.
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

  onLocationSelected(location: SelectedCoordinates): void {
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
