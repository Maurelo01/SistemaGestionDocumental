import { Injectable, computed, signal } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class CargaService
{
    private readonly peticionesActivas = signal<number>(0);
    readonly cargando = computed(() => this.peticionesActivas() > 0);

    mostrar(): void
    {
        this.peticionesActivas.update((actual) => actual + 1);
    }

    ocultar(): void
    {
        this.peticionesActivas.update((actual) => Math.max(0, actual - 1));
    }
}