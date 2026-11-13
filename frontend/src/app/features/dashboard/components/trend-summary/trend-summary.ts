
import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

import type {
  TrendAnalysisResponse,
} from '../../../../core/models/climate.model';

@Component({
  selector: 'app-trend-summary',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <section
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Climate trend statistics"
    >

      <!-- TEMPERATURE TREND -->
      <article
        class="group relative min-w-0 overflow-hidden
               rounded-2xl border border-sky-900/70
               bg-[#091a30] p-5
               transition-all duration-300
               hover:-translate-y-1
               hover:border-sky-500/60
               hover:shadow-[0_15px_35px_rgba(14,165,233,0.08)]"
      >
        <div
          class="pointer-events-none absolute -right-10 -top-10
                 h-32 w-32 rounded-full bg-sky-400/5
                 blur-3xl"
        ></div>

        <div class="relative flex items-start justify-between gap-3">
          <div>
            <p
              class="text-xs font-semibold uppercase
                     tracking-[0.12em] text-slate-400"
            >
              Temperature trend
            </p>

            <p class="mt-1 text-xs text-slate-500">
              Change per decade
            </p>
          </div>

          <div
            class="flex h-11 w-11 shrink-0 items-center
                   justify-center rounded-xl
                   border border-sky-700/50
                   bg-sky-500/10 text-sky-300"
          >
            <!-- TREND LINE ICON -->
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
              <path d="M3 3v18h18" />
              <path d="m7 16 4-5 4 3 5-7" />
              <path d="M16 7h4v4" />
            </svg>
          </div>
        </div>

        <div class="relative mt-7">
          <div class="flex flex-wrap items-baseline gap-2">
            <span
              class="text-3xl font-semibold tracking-tight
                     text-white tabular-nums"
            >
              {{
                data().slope_celsius_per_decade
                  | number:'1.3-3'
              }}
            </span>

            <span class="text-sm text-slate-400">
              °C/decade
            </span>
          </div>

          <div
            class="mt-5 flex items-center gap-2
                   border-t border-sky-900/60 pt-4"
          >
            <span
              class="flex h-6 w-6 items-center
                     justify-center rounded-full"
              [class]="
                data().slope_celsius_per_decade > 0
                  ? 'bg-orange-500/10 text-orange-300'
                  : data().slope_celsius_per_decade < 0
                    ? 'bg-cyan-500/10 text-cyan-300'
                    : 'bg-slate-500/10 text-slate-300'
              "
            >
              @if (data().slope_celsius_per_decade > 0) {
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="m7 17 10-10" />
                  <path d="M7 7h10v10" />
                </svg>
              } @else if (data().slope_celsius_per_decade < 0) {
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="m7 7 10 10" />
                  <path d="M17 7v10H7" />
                </svg>
              } @else {
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14" />
                </svg>
              }
            </span>

            <span class="text-xs font-medium text-slate-300">
              {{ temperatureDirection() }}
            </span>
          </div>
        </div>
      </article>

      <!-- R SQUARED -->
      <article
        class="group relative min-w-0 overflow-hidden
               rounded-2xl border border-sky-900/70
               bg-[#091a30] p-5
               transition-all duration-300
               hover:-translate-y-1
               hover:border-violet-500/50
               hover:shadow-[0_15px_35px_rgba(139,92,246,0.08)]"
      >
        <div
          class="pointer-events-none absolute -right-10 -top-10
                 h-32 w-32 rounded-full bg-violet-400/5
                 blur-3xl"
        ></div>

        <div class="relative flex items-start justify-between gap-3">
          <div>
            <p
              class="text-xs font-semibold uppercase
                     tracking-[0.12em] text-slate-400"
            >
              R² coefficient
            </p>

            <p class="mt-1 text-xs text-slate-500">
              Model fit
            </p>
          </div>

          <div
            class="flex h-11 w-11 shrink-0 items-center
                   justify-center rounded-xl
                   border border-violet-700/40
                   bg-violet-500/10 text-violet-300"
          >
            <!-- SCATTER PLOT ICON -->
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
              <path d="M3 3v18h18" />
              <circle cx="7" cy="15" r="1.3" />
              <circle cx="11" cy="11" r="1.3" />
              <circle cx="15" cy="13" r="1.3" />
              <circle cx="19" cy="6" r="1.3" />
              <path d="m6 17 13-11" stroke-dasharray="3 3" />
            </svg>
          </div>
        </div>

        <div class="relative mt-7">
          <div class="flex flex-wrap items-baseline gap-2">
            <span
              class="text-3xl font-semibold tracking-tight
                     text-white tabular-nums"
            >
              {{ data().r_squared | number:'1.3-3' }}
            </span>

            <span class="text-sm text-slate-400">
              / 1.000
            </span>
          </div>

          <!-- R² PROGRESS BAR -->
          <div
            class="mt-5 h-1.5 overflow-hidden rounded-full
                   bg-slate-800"
            role="progressbar"
            aria-label="Explained variation"
            aria-valuemin="0"
            aria-valuemax="100"
            [attr.aria-valuenow]="explainedVariation()"
          >
            <div
              class="h-full rounded-full
                     bg-gradient-to-r
                     from-violet-500 to-sky-400
                     transition-all duration-700"
              [style.width.%]="explainedVariation()"
            ></div>
          </div>

          <p class="mt-3 text-xs text-slate-400">
            {{ explainedVariation() | number:'1.1-1' }}%
            of variance explained
          </p>
        </div>
      </article>

      <!-- P VALUE -->
      <article
        class="group relative min-w-0 overflow-hidden
               rounded-2xl border border-sky-900/70
               bg-[#091a30] p-5
               transition-all duration-300
               hover:-translate-y-1
               hover:border-cyan-500/50
               hover:shadow-[0_15px_35px_rgba(6,182,212,0.08)]"
      >
        <div
          class="pointer-events-none absolute -right-10 -top-10
                 h-32 w-32 rounded-full bg-cyan-400/5
                 blur-3xl"
        ></div>

        <div class="relative flex items-start justify-between gap-3">
          <div>
            <p
              class="text-xs font-semibold uppercase
                     tracking-[0.12em] text-slate-400"
            >
              P-value
            </p>

            <p class="mt-1 text-xs text-slate-500">
              Statistical significance
            </p>
          </div>

          <div
            class="flex h-11 w-11 shrink-0 items-center
                   justify-center rounded-xl
                   border border-cyan-700/40
                   bg-cyan-500/10 text-cyan-300"
          >
            <!-- SIGMA ICON -->
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
              <path d="M19 4H6l7 8-7 8h13" />
              <path d="M16 7h3V4" />
              <path d="M16 17h3v3" />
            </svg>
          </div>
        </div>

        <div class="relative mt-7">
          <p
            class="text-3xl font-semibold tracking-tight
                   text-white tabular-nums"
          >
            {{ data().p_value | number:'1.5-5' }}
          </p>

          <div
            class="mt-5 flex flex-wrap items-center
                   gap-2 border-t border-sky-900/60 pt-4"
          >
            <span
              class="rounded-full border px-3 py-1
                     text-xs font-medium"
              [class]="
                data().significant
                  ? 'border-cyan-700/50 bg-cyan-500/10 text-cyan-300'
                  : 'border-amber-700/50 bg-amber-500/10 text-amber-300'
              "
            >
              {{
                data().significant
                  ? 'Significant'
                  : 'Not significant'
              }}
            </span>

            <span class="text-xs text-slate-500">
              α = 0.05
            </span>
          </div>
        </div>
      </article>

      <!-- TREND CLASSIFICATION -->
      <article
        class="group relative min-w-0 overflow-hidden
               rounded-2xl border border-sky-900/70
               bg-[#091a30] p-5
               transition-all duration-300
               hover:-translate-y-1
               hover:border-orange-500/50
               hover:shadow-[0_15px_35px_rgba(249,115,22,0.08)]"
      >
        <div
          class="pointer-events-none absolute -right-10 -top-10
                 h-32 w-32 rounded-full bg-orange-400/5
                 blur-3xl"
        ></div>

        <div class="relative flex items-start justify-between gap-3">
          <div>
            <p
              class="text-xs font-semibold uppercase
                     tracking-[0.12em] text-slate-400"
            >
              Trend classification
            </p>

            <p class="mt-1 text-xs text-slate-500">
              Climate assessment
            </p>
          </div>

          <div
            class="flex h-11 w-11 shrink-0 items-center
                   justify-center rounded-xl
                   border border-orange-700/40
                   bg-orange-500/10 text-orange-300"
          >
            <!-- THERMOMETER ICON -->
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
              <path d="M14 14.76V5a3 3 0 0 0-6 0v9.76a5 5 0 1 0 6 0Z" />
              <path d="M11 10v7" />
              <circle cx="11" cy="18" r="1" />
            </svg>
          </div>
        </div>

        <div class="relative mt-7">
          <p
            class="text-3xl font-semibold
                   capitalize tracking-tight"
            [class]="
              data().trend === 'warming'
                ? 'text-orange-300'
                : data().trend === 'cooling'
                  ? 'text-cyan-300'
                  : 'text-white'
            "
          >
            {{ data().trend }}
          </p>

          <div
            class="mt-5 flex flex-wrap items-center
                   gap-2 border-t border-sky-900/60 pt-4"
          >
            <span
              class="h-2 w-2 rounded-full"
              [class]="
                data().significant
                  ? 'bg-cyan-400'
                  : 'bg-amber-400'
              "
            ></span>

            <span class="text-xs leading-5 text-slate-400">
              {{
                data().significant
                  ? 'Statistically significant at 95% confidence'
                  : 'Not statistically significant at 95% confidence'
              }}
            </span>
          </div>
        </div>
      </article>

    </section>
  `,
})
export class TrendSummary {
  readonly data = input.required<TrendAnalysisResponse>();

  readonly temperatureDirection = computed(() => {
    const slope = this.data().slope_celsius_per_decade;

    if (slope > 0) {
      return 'Increasing temperature';
    }

    if (slope < 0) {
      return 'Decreasing temperature';
    }

    return 'No estimated change';
  });

  readonly explainedVariation = computed(() => {
    const value = this.data().r_squared;

    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.min(100, Math.max(0, value * 100));
  });
}
