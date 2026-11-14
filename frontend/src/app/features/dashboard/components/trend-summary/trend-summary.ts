
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
               rounded-2xl border border-slate-700/50
               bg-[#091a30] p-5
               transition-all duration-300 ease-out
               hover:-translate-y-0.5
               hover:border-slate-500/60
               hover:bg-[#0d2038]"
      >
        <div class="flex items-start justify-between gap-3">
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
                   border border-slate-700/60
                   bg-white/[0.04] text-slate-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
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

        <div class="mt-7">
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
                   border-t border-slate-700/40 pt-4"
          >
            <span
              class="flex h-6 w-6 items-center
                     justify-center rounded-full
                     bg-white/[0.05] text-slate-300"
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
               rounded-2xl border border-slate-700/50
               bg-[#091a30] p-5
               transition-all duration-300 ease-out
               hover:-translate-y-0.5
               hover:border-slate-500/60
               hover:bg-[#0d2038]"
      >
        <div class="flex items-start justify-between gap-3">
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
                   border border-slate-700/60
                   bg-white/[0.04] text-slate-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M3 3v18h18" />
              <circle cx="7" cy="15" r="1.3" />
              <circle cx="11" cy="11" r="1.3" />
              <circle cx="15" cy="13" r="1.3" />
              <circle cx="19" cy="6" r="1.3" />
              <path
                d="m6 17 13-11"
                stroke-dasharray="3 3"
              />
            </svg>
          </div>
        </div>

        <div class="mt-7">
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

          <!-- PROGRESS BAR -->
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
              class="h-full rounded-full bg-slate-400
                     transition-all duration-700 ease-out"
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
               rounded-2xl border border-slate-700/50
               bg-[#091a30] p-5
               transition-all duration-300 ease-out
               hover:-translate-y-0.5
               hover:border-slate-500/60
               hover:bg-[#0d2038]"
      >
        <div class="flex items-start justify-between gap-3">
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
                   border border-slate-700/60
                   bg-white/[0.04] text-slate-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
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

        <div class="mt-7">
          <p
            class="text-3xl font-semibold tracking-tight
                   text-white tabular-nums"
          >
            {{ data().p_value | number:'1.5-5' }}
          </p>

          <div
            class="mt-5 flex flex-wrap items-center gap-2
                   border-t border-slate-700/40 pt-4"
          >
            <span
              class="rounded-full border px-3 py-1
                     text-xs font-medium"
              [class]="
                data().significant
                  ? 'border-slate-500/60 bg-slate-700/40 text-slate-200'
                  : 'border-slate-700 bg-slate-800/60 text-slate-400'
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
               rounded-2xl border border-slate-700/50
               bg-[#091a30] p-5
               transition-all duration-300 ease-out
               hover:-translate-y-0.5
               hover:border-slate-500/60
               hover:bg-[#0d2038]"
      >
        <div class="flex items-start justify-between gap-3">
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
                   border border-slate-700/60
                   bg-white/[0.04] text-slate-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
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

        <div class="mt-7">
          <p
            class="text-3xl font-semibold capitalize
                   tracking-tight text-white"
          >
            {{ data().trend }}
          </p>

          <div
            class="mt-5 flex flex-wrap items-center gap-2
                   border-t border-slate-700/40 pt-4"
          >
            <span
              class="h-2 w-2 rounded-full"
              [class]="
                data().significant
                  ? 'bg-slate-300'
                  : 'bg-slate-600'
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
