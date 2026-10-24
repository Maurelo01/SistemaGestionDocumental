import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CargaService } from '../../services/carga';

@Component({
    selector: 'app-spinner',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './spinner.html',
    styleUrl: './spinner.css',
})
export class Spinner
{
    readonly cargaService = inject(CargaService);

    @Input() forzar = false;
    @Input() modoOverlay = true;
}