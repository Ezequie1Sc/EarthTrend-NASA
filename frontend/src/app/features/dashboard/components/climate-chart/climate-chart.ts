
import {
  Component,
  ElementRef,
  effect,
  input,
  OnDestroy,
  viewChild,
} from '@angular/core';

import {
  Chart,
  ChartConfiguration,
  registerables,
} from 'chart.js';

import { TrendAnalysisResponse } from '../../../../core/models/climate.model';
Chart.register(...registerables);

@Component({
  selector: 'app-climate-chart',
  standalone: true,
  template: `
    <section class="rounded-2xl border border-slate-200 bg-white p-6">
      <div class="mb-6">
        <h2 class="text-lg font-semibold text-slate-900">
          Historical temperature analysis
        </h2>
        <p class="text-sm text-slate-500">
          NASA POWER annual temperature observations and linear regression
        </p>
      </div>

      <div class="relative h-80 w-full">
        <canvas #chartCanvas></canvas>
      </div>
    </section>
  `,
})
export class ClimateChart implements OnDestroy {
  readonly data = input.required<TrendAnalysisResponse>();

  private readonly canvas =
    viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');

  private chart?: Chart;

  constructor() {
    effect(() => {
      const canvas = this.canvas();
      const analysis = this.data();

      if (!canvas) return;

      this.renderChart(canvas.nativeElement, analysis);
    });
  }

  private renderChart(
    canvas: HTMLCanvasElement,
    analysis: TrendAnalysisResponse,
  ): void {
    this.chart?.destroy();

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
            label: 'Annual temperature (°C)',
            data: analysis.temperatures,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.12)',
            tension: 0.3,
            pointRadius: 4,
            fill: true,
          },
          {
            label: 'Linear trend',
            data: regression,
            borderColor: '#ea580c',
            borderDash: [7, 5],
            pointRadius: 0,
            tension: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'bottom',
          },
          tooltip: {
            enabled: true,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Year',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Temperature (°C)',
            },
          },
        },
      },
    };

    this.chart = new Chart(canvas, configuration);
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
