import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EarthGlobe } from '../../components/earth-globe/earth-globe';

@Component({
  selector: 'app-earth-explorer',
  standalone: true,
  imports: [RouterLink, EarthGlobe],
  template: `
    <main class="min-h-screen bg-[#030b19] text-white">
      <header
        class="flex flex-wrap items-center justify-between gap-4
               border-b border-sky-900/60 px-6 py-4"
      >
        <div>
          <p class="text-xs uppercase tracking-[0.25em] text-sky-400">
            NASA Space Apps Challenge 2026
          </p>

          <h1 class="mt-1 text-2xl font-semibold">
            EarthTrend NASA
          </h1>

          <p class="text-sm text-slate-400">
            Climate Data Explorer
          </p>
        </div>

        <nav class="flex flex-wrap items-center gap-3">
          <a
            routerLink="/explorer"
            class="rounded-xl border border-sky-500 bg-sky-950
                   px-4 py-2 text-sm text-sky-200"
          >
            Earth Explorer
          </a>

          <a
            routerLink="/"
            class="rounded-xl border border-slate-700
                   px-4 py-2 text-sm text-slate-300
                   hover:border-sky-500"
          >
            Climate Dashboard
          </a>

          <button
            type="button"
            (click)="toggleImmersive()"
            class="rounded-xl bg-sky-600 px-4 py-2
                   text-sm font-medium hover:bg-sky-500"
          >
            {{
              immersive()
                ? 'Show panels'
                : 'Immersive view'
            }}
          </button>
        </nav>
      </header>

      <section
        class="mx-auto grid max-w-[1800px] gap-5 p-5"
        [class.lg:grid-cols-[280px_minmax(0,1fr)_280px]]="!immersive()"
      >
        @if (!immersive()) {
          <aside
            class="rounded-2xl border border-sky-900/70
                   bg-[#091a30] p-5"
          >
            <h2 class="text-xl font-semibold">
              Earth Explorer
            </h2>

            <p class="mt-3 text-sm leading-6 text-slate-300">
              Explore Earth's climate and investigate historical
              temperature trends using NASA POWER observations.
            </p>

            <div class="mt-6 rounded-xl bg-[#102743] p-4">
              <p class="text-sm font-medium text-sky-300">
                Available observations
              </p>

              <p class="mt-2 text-sm text-slate-300">
                Point-based annual temperature data.
              </p>
            </div>
          </aside>
        }

        <div
          class="relative min-h-[560px] overflow-hidden rounded-2xl
                 border border-sky-900/70 bg-[#020817]"
          [class.min-h-[calc(100vh-140px)]]="immersive()"
        >
          <app-earth-globe />
        </div>

        @if (!immersive()) {
          <aside class="space-y-5">
            <section
              class="rounded-2xl border border-sky-900/70
                     bg-[#091a30] p-5"
            >
              <h2 class="text-lg font-semibold">
                Display Options
              </h2>

              <p class="mt-4 text-sm text-slate-400">
                Visualization
              </p>

              <p class="mt-2 text-sm">
                Interactive 3D Earth
              </p>
            </section>

            <section
              class="rounded-2xl border border-sky-900/70
                     bg-[#091a30] p-5"
            >
              <h2 class="text-lg font-semibold">
                Data Source
              </h2>

              <p class="mt-3 text-sm text-sky-300">
                NASA POWER
              </p>

              <p class="mt-2 text-xs leading-5 text-slate-400">
                Temperature observations are retrieved
                for selected geographic coordinates.
              </p>
            </section>
          </aside>
        }
      </section>
    </main>
  `,
})
export class EarthExplorer {
  readonly immersive = signal(false);

  toggleImmersive(): void {
    this.immersive.update((value) => !value);
  }
}