
import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TrendAnalysisResponse } from '../../../../core/models/climate.model';
@Component({
  selector: 'app-trend-summary',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article class="rounded-2xl border border-slate-200 bg-white p-5">
        <p class="text-sm text-slate-500">Temperature trend</p>
        <h3 class="mt-2 text-2xl font-semibold text-slate-900">
          {{ data().slope_celsius_per_decade | number:'1.2-3' }}
          <span class="text-sm font-normal">°C/decade</span>
        </h3>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-white p-5">
        <p class="text-sm text-slate-500">R² coefficient</p>
        <h3 class="mt-2 text-2xl font-semibold text-slate-900">
          {{ data().r_squared | number:'1.3-3' }}
        </h3>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-white p-5">
        <p class="text-sm text-slate-500">P-value</p>
        <h3 class="mt-2 text-2xl font-semibold text-slate-900">
          {{ data().p_value | number:'1.3-5' }}
        </h3>
      </article>

      <article class="rounded-2xl border border-slate-200 bg-white p-5">
        <p class="text-sm text-slate-500">Trend classification</p>
        <h3 class="mt-2 text-xl font-semibold capitalize text-slate-900">
          {{ data().trend }}
        </h3>
        <p class="mt-1 text-xs text-slate-500">
          {{ data().significant
            ? 'Statistically significant at 95% confidence'
            : 'No statistically significant trend detected' }}
        </p>
      </article>
    </section>
  `,
})
export class TrendSummary {
  readonly data = input.required<TrendAnalysisResponse>();
}
