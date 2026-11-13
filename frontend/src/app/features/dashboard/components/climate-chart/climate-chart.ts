
import {
  Component,
  ElementRef,
  effect,
  inject,
  input,
  OnDestroy,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { DecimalPipe, DOCUMENT } from '@angular/common';

import {
  Chart,
  ChartConfiguration,
  registerables,
} from 'chart.js';

import type {
  TrendAnalysisResponse,
} from '../../../../core/models/climate.model';

Chart.register(...registerables);

@Component({
  selector: 'app-climate-chart',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <section
      #fullscreenContainer
      class="relative flex min-w-0 flex-col overflow-hidden
             rounded-2xl border border-sky-900/70
             bg-[#091a30] p-5 text-white
             shadow-[0_20px_60px_rgba(0,0,0,0.12)]
             sm:p-7"
      [class.!fixed]="isFullscreen()"
      [class.!inset-0]="isFullscreen()"
      [class.!z-[9999]]="isFullscreen()"
      [class.!h-screen]="isFullscreen()"
      [class.!w-screen]="isFullscreen()"
      [class.!rounded-none]="isFullscreen()"
      [class.!border-0]="isFullscreen()"
    >

      <!-- DECORATIVE BACKGROUND -->
      <div
        class="pointer-events-none absolute -right-24
               -top-32 h-72 w-72 rounded-full
               bg-sky-500/5 blur-3xl"
      ></div>

      <!-- HEADER -->
      <div
        class="relative flex flex-wrap items-start
               justify-between gap-5"
      >
        <div>
          <p
            class="text-xs font-semibold uppercase
                   tracking-[0.2em] text-sky-400"
          >
            Temperature observations
          </p>

          <h2
            class="mt-2 text-xl font-semibold
                   tracking-tight text-white"
          >
            Historical Temperature Trends
          </h2>

          <p class="mt-2 text-sm leading-6 text-slate-400">
            NASA POWER annual observations and linear regression
          </p>
        </div>

        <!-- HEADER ACTIONS -->
        <div class="flex items-center gap-2">

          <!-- ANALYSIS PERIOD -->
          <div
            class="mr-1 hidden rounded-xl
                   border border-sky-800/60
                   bg-[#102743] px-4 py-3 sm:block"
          >
            <p
              class="text-xs uppercase tracking-wider
                     text-slate-400"
            >
              Analysis period
            </p>

            <p class="mt-1 text-sm font-semibold text-white">
              {{ data().start_year }}–{{ data().end_year }}
            </p>
          </div>

          <!-- EXPAND WITHIN DASHBOARD -->
          <button
            type="button"
            (click)="toggleExpanded()"
            [attr.aria-label]="
              expanded()
                ? 'Restore chart layout'
                : 'Expand chart within dashboard'
            "
            [attr.title]="
              expanded()
                ? 'Restore side-by-side layout'
                : 'Expand chart and move form below'
            "
            [attr.aria-pressed]="expanded()"
            class="flex h-11 w-11 shrink-0 items-center
                   justify-center rounded-xl
                   border border-sky-800
                   bg-[#102743] text-sky-300
                   transition duration-200
                   hover:border-sky-400
                   hover:bg-sky-900
                   hover:text-white
                   focus-visible:outline-2
                   focus-visible:outline-offset-2
                   focus-visible:outline-sky-400"
          >
            @if (expanded()) {
              <!-- RESTORE TWO-COLUMN LAYOUT -->
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
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="2"
                />
                <path d="M3 10h18" />
                <path d="M10 10v11" />
              </svg>
            } @else {
              <!-- EXPAND CHART -->
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
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="2"
                />
                <path d="M10 3v18" />
                <path d="m15 9 3 3-3 3" />
              </svg>
            }
          </button>

          <!-- REAL BROWSER FULLSCREEN -->
          <button
            type="button"
            (click)="toggleFullscreen()"
            [attr.aria-label]="
              isFullscreen()
                ? 'Exit fullscreen'
                : 'Enter fullscreen'
            "
            [attr.title]="
              isFullscreen()
                ? 'Exit fullscreen (Esc)'
                : 'View fullscreen'
            "
            class="flex h-11 w-11 shrink-0 items-center
                   justify-center rounded-xl
                   border border-sky-800
                   bg-[#102743] text-sky-300
                   transition duration-200
                   hover:border-sky-400
                   hover:bg-sky-900
                   hover:text-white
                   focus-visible:outline-2
                   focus-visible:outline-offset-2
                   focus-visible:outline-sky-400"
          >
            @if (isFullscreen()) {
              <!-- EXIT FULLSCREEN -->
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
                <path d="M8 3v5H3" />
                <path d="M16 3v5h5" />
                <path d="M8 21v-5H3" />
                <path d="M16 21v-5h5" />
                <path d="m3 8 6-6" />
                <path d="m21 8-6-6" />
                <path d="m3 16 6 6" />
                <path d="m21 16-6 6" />
              </svg>
            } @else {
              <!-- ENTER FULLSCREEN -->
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
                <path d="M8 3H3v5" />
                <path d="M16 3h5v5" />
                <path d="M8 21H3v-5" />
                <path d="M16 21h5v-5" />
              </svg>
            }
          </button>
        </div>
      </div>

      <!-- TEMPERATURE STATISTICS -->
      <div
        class="relative mt-7 grid grid-cols-1
               gap-3 sm:grid-cols-3"
      >

        <!-- AVERAGE -->
        <article
          class="rounded-xl border border-sky-900/60
                 bg-[#10243d] p-4"
        >
          <p class="text-xs text-slate-400">
            Average temperature
          </p>

          <p
            class="mt-2 text-2xl font-semibold
                   tracking-tight text-white"
          >
            {{ averageTemperature | number:'1.2-2' }}
            <span class="text-sm font-normal text-slate-400">
              °C
            </span>
          </p>
        </article>

        <!-- MINIMUM -->
        <article
          class="rounded-xl border border-sky-900/60
                 bg-[#10243d] p-4"
        >
          <p class="text-xs text-slate-400">
            Lowest annual temperature
          </p>

          <p
            class="mt-2 text-2xl font-semibold
                   tracking-tight text-cyan-300"
          >
            {{ minimumTemperature | number:'1.2-2' }}
            <span class="text-sm font-normal text-slate-400">
              °C
            </span>
          </p>
        </article>

        <!-- MAXIMUM -->
        <article
          class="rounded-xl border border-sky-900/60
                 bg-[#10243d] p-4"
        >
          <p class="text-xs text-slate-400">
            Highest annual temperature
          </p>

          <p
            class="mt-2 text-2xl font-semibold
                   tracking-tight text-orange-300"
          >
            {{ maximumTemperature | number:'1.2-2' }}
            <span class="text-sm font-normal text-slate-400">
              °C
            </span>
          </p>
        </article>
      </div>

      <!-- CHART PANEL -->
      <div
        class="relative mt-6 flex min-h-0 min-w-0
               flex-col rounded-xl
               border border-sky-900/60
               bg-[#071527] px-3 py-5
               sm:px-5 sm:py-6"
        [class.flex-1]="isFullscreen()"
      >
        <div
          class="mb-5 flex flex-wrap items-center
                 justify-between gap-3"
        >
          <div>
            <p class="text-sm font-semibold text-white">
              Annual temperature evolution
            </p>

            <p class="mt-1 text-xs text-slate-500">
              Temperature in degrees Celsius
            </p>
          </div>

          <span
            class="rounded-full border border-sky-800/60
                   bg-sky-950/50 px-3 py-1
                   text-xs text-sky-300"
          >
            Annual data
          </span>
        </div>

        <!-- CHART.JS CANVAS -->
        <div
          #chartHost
          class="relative min-h-0 min-w-0 w-full"
          [class.h-[340px]]="!isFullscreen() && !expanded()"
          [class.sm:h-[400px]]="!isFullscreen() && !expanded()"
          [class.h-[460px]]="!isFullscreen() && expanded()"
          [class.lg:h-[520px]]="!isFullscreen() && expanded()"
          [class.flex-1]="isFullscreen()"
        >
          <canvas
            #chartCanvas
            role="img"
            aria-label="Annual temperature observations and linear regression trend chart"
          ></canvas>
        </div>
      </div>

      <!-- LEGEND -->
      <div
        class="mt-5 flex flex-wrap items-center
               justify-between gap-4"
      >
        <div class="flex flex-wrap items-center gap-6">
          <div class="flex items-center gap-2">
            <span class="h-2.5 w-2.5 rounded-full bg-cyan-400"></span>
            <span class="text-xs text-slate-300">
              Annual temperature
            </span>
          </div>

          <div class="flex items-center gap-2">
            <span
              class="h-0.5 w-6 border-t-2
                     border-dashed border-orange-400"
            ></span>
            <span class="text-xs text-slate-300">
              Linear trend
            </span>
          </div>
        </div>

        <p class="text-xs text-slate-500">
          Source: NASA POWER
        </p>
      </div>

      <!-- TREND SUMMARY -->
      <div
        class="mt-5 flex flex-wrap items-start
               justify-between gap-4 rounded-xl
               border border-sky-800/50
               bg-sky-950/30 p-4"
      >
        <div>
          <p
            class="text-xs font-semibold uppercase
                   tracking-wider text-sky-400"
          >
            Estimated temperature trend
          </p>

          <p class="mt-2 text-xl font-semibold text-white">
            {{ data().slope_celsius_per_decade | number:'1.2-3' }}
            <span class="text-sm font-normal text-slate-400">
              °C/decade
            </span>
          </p>
        </div>

        <div
          class="rounded-lg border border-sky-800/60
                 bg-[#102743] px-4 py-2"
        >
          <p class="text-xs text-slate-400">
            Trend classification
          </p>

          <p
            class="mt-1 text-sm font-semibold
                   capitalize text-sky-300"
          >
            {{ data().trend }}
          </p>
        </div>
      </div>

      @if (isFullscreen()) {
        <p class="mt-3 text-center text-xs text-slate-500">
          Press Esc or use the minimize button to exit fullscreen.
        </p>
      }
    </section>
  `,
})
export class ClimateChart implements OnDestroy {
  readonly data = input.required<TrendAnalysisResponse>();

  // Dashboard expansion is controlled by EarthExplorer.
  readonly expanded = input(false);
  readonly expandedChange = output<boolean>();

  private readonly document = inject(DOCUMENT);

  private readonly fullscreenContainer =
    viewChild<ElementRef<HTMLElement>>('fullscreenContainer');

  private readonly canvas =
    viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');

  private readonly chartHost =
    viewChild<ElementRef<HTMLElement>>('chartHost');

  readonly isFullscreen = signal(false);

  private chart?: Chart<'line'>;
  private resizeObserver?: ResizeObserver;
  private destroyed = false;

  private readonly fullscreenChangeHandler = () => {
    const container = this.fullscreenContainer()?.nativeElement;

    this.isFullscreen.set(
      this.document.fullscreenElement === container,
    );

    this.scheduleChartResize();
  };

  constructor() {
    // Recreate the chart only when the analysis changes.
    effect(() => {
      const canvas = this.canvas();
      const analysis = this.data();

      if (!canvas) {
        return;
      }

      this.renderChart(canvas.nativeElement, analysis);
    });

    // Resize the existing chart when the dashboard layout changes.
    effect(() => {
      this.expanded();
      this.scheduleChartResize();
    });

    this.document.addEventListener(
      'fullscreenchange',
      this.fullscreenChangeHandler,
    );
  }

  get averageTemperature(): number | null {
    const values = this.validTemperatures;

    if (!values.length) {
      return null;
    }

    return (
      values.reduce((sum, value) => sum + value, 0) /
      values.length
    );
  }

  get minimumTemperature(): number | null {
    const values = this.validTemperatures;

    return values.length ? Math.min(...values) : null;
  }

  get maximumTemperature(): number | null {
    const values = this.validTemperatures;

    return values.length ? Math.max(...values) : null;
  }

  private get validTemperatures(): number[] {
    return this.data().temperatures.filter(
      (value): value is number =>
        typeof value === 'number' &&
        Number.isFinite(value),
    );
  }

  /**
   * Expand or restore the chart within Climate Analysis.
   * The form is moved by the parent component.
   */
  toggleExpanded(): void {
    this.expandedChange.emit(!this.expanded());
  }

  /**
   * Enter or exit real browser fullscreen.
   */
  async toggleFullscreen(): Promise<void> {
    const container = this.fullscreenContainer()?.nativeElement;

    if (!container) {
      return;
    }

    try {
      if (this.document.fullscreenElement === container) {
        await this.document.exitFullscreen();
        return;
      }

      if (this.document.fullscreenElement) {
        await this.document.exitFullscreen();
      }

      if (!container.requestFullscreen) {
        return;
      }

      await container.requestFullscreen();
    } catch (error) {
      console.error(
        'Unable to toggle chart fullscreen:',
        error,
      );
    }
  }

  /**
   * Update Chart.js after a container size change.
   */
  private scheduleChartResize(): void {
    if (this.destroyed) {
      return;
    }

    requestAnimationFrame(() => {
      if (this.destroyed) {
        return;
      }

      this.chart?.resize();
      this.chart?.update('none');
    });
  }

  /**
   * Draw NASA POWER annual temperatures and linear regression.
   */
  private renderChart(
    canvas: HTMLCanvasElement,
    analysis: TrendAnalysisResponse,
  ): void {
    this.resizeObserver?.disconnect();
    this.chart?.destroy();

    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    const chartHeight =
      canvas.parentElement?.clientHeight ?? 400;

    const gradient = context.createLinearGradient(
      0,
      0,
      0,
      Math.max(chartHeight, 1),
    );

    gradient.addColorStop(
      0,
      'rgba(34, 211, 238, 0.28)',
    );

    gradient.addColorStop(
      0.5,
      'rgba(14, 165, 233, 0.10)',
    );

    gradient.addColorStop(
      1,
      'rgba(14, 165, 233, 0)',
    );

    const regression = analysis.years.map(
      year =>
        analysis.intercept +
        analysis.slope_celsius_per_year * year,
    );

    const configuration: ChartConfiguration<'line'> = {
      type: 'line',

      data: {
        labels: analysis.years.map(String),

        datasets: [
          {
            label: 'Annual temperature',
            data: analysis.temperatures,

            borderColor: '#22d3ee',
            backgroundColor: gradient,

            borderWidth: 3,
            tension: 0.35,

            pointRadius: 2.5,
            pointHoverRadius: 6,
            pointHitRadius: 14,

            pointBackgroundColor: '#071527',
            pointBorderColor: '#67e8f9',
            pointBorderWidth: 2,

            fill: true,
            spanGaps: false,
          },
          {
            label: 'Linear trend',
            data: regression,

            borderColor: '#fb923c',
            backgroundColor: 'transparent',

            borderWidth: 2.5,
            borderDash: [8, 6],

            pointRadius: 0,
            pointHoverRadius: 0,

            tension: 0,
            fill: false,
          },
        ],
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        animation: {
          duration: 900,
          easing: 'easeOutQuart',
        },

        interaction: {
          mode: 'index',
          intersect: false,
        },

        layout: {
          padding: {
            top: 12,
            right: 12,
            bottom: 4,
            left: 4,
          },
        },

        plugins: {
          legend: {
            display: false,
          },

          tooltip: {
            enabled: true,

            backgroundColor: '#102743',
            titleColor: '#ffffff',
            bodyColor: '#cbd5e1',

            borderColor: '#1e496d',
            borderWidth: 1,

            padding: 14,
            cornerRadius: 10,
            displayColors: true,

            callbacks: {
              title: items =>
                items.length ? `Year ${items[0].label}` : '',

              label: item => {
                const value = item.parsed.y;

                if (value === null) {
                  return item.dataset.label ?? '';
                }

                return (
                  `${item.dataset.label}: ` +
                  `${value.toFixed(2)} °C`
                );
              },
            },
          },
        },

        scales: {
          x: {
            grid: {
              color: 'rgba(148, 163, 184, 0.06)',
            },

            border: {
              display: false,
            },

            ticks: {
              color: '#94a3b8',
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 9,

              font: {
                size: 11,
              },
            },

            title: {
              display: true,
              text: 'Year',
              color: '#64748b',

              font: {
                size: 11,
              },

              padding: {
                top: 12,
              },
            },
          },

          y: {
            grid: {
              color: 'rgba(148, 163, 184, 0.10)',
            },

            border: {
              display: false,
              dash: [4, 4],
            },

            ticks: {
              color: '#94a3b8',
              padding: 12,

              callback: value => `${value}°`,

              font: {
                size: 11,
              },
            },

            title: {
              display: true,
              text: 'Temperature (°C)',
              color: '#64748b',

              font: {
                size: 11,
              },

              padding: {
                bottom: 12,
              },
            },
          },
        },
      },
    };

    this.chart = new Chart(context, configuration);

    // Observe the chart container so Chart.js follows layout changes.
    const host = this.chartHost()?.nativeElement;

    if (host && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.scheduleChartResize();
      });

      this.resizeObserver.observe(host);
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;

    this.document.removeEventListener(
      'fullscreenchange',
      this.fullscreenChangeHandler,
    );

    this.resizeObserver?.disconnect();

    if (
      this.document.fullscreenElement ===
      this.fullscreenContainer()?.nativeElement
    ) {
      void this.document.exitFullscreen().catch(() => {
        // Ignore fullscreen cleanup errors.
      });
    }

    this.chart?.destroy();
  }
}
