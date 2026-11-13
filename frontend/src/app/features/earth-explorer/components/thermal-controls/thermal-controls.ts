import { Component, input, output } from '@angular/core';
import { ThermalGrid, ThermalProvider, ThermalSource } from '../../../../core/models/thermal.model';
import { TEMPERATURE_STOPS } from '../earth-globe/thermal-raster';

@Component({
  selector: 'app-thermal-controls', standalone: true,
  templateUrl: './thermal-controls.html', styleUrl: './thermal-controls.css',
})
export class ThermalControls {
  readonly layer = input<'surface' | 'temperature'>('temperature');
  readonly sources = input<ThermalSource[]>([]);
  readonly provider = input<ThermalProvider>('noaa');
  readonly date = input('2024-06-15');
  readonly opacity = input(100);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly grid = input<ThermalGrid | null>(null);
  readonly layerChange = output<'surface' | 'temperature'>();
  readonly providerChange = output<ThermalProvider>();
  readonly dateChange = output<string>();
  readonly opacityChange = output<number>();
  readonly retry = output<void>();
  readonly ticks = [-20, -10, 0, 10, 20, 30, 40];
  readonly gradient = 'linear-gradient(to right, ' + TEMPERATURE_STOPS.map(([t,r,g,b]) => `rgb(${r},${g},${b}) ${(t+20)/60*100}%`).join(', ') + ')';
  source() { return this.sources().find(s => s.id === this.provider()); }
  value(event: Event) { return (event.target as HTMLInputElement).value; }
  selectProvider(event: Event) { this.providerChange.emit(this.value(event) as ThermalProvider); }
  selectOpacity(event: Event) { this.opacityChange.emit(Number(this.value(event))); }
}
