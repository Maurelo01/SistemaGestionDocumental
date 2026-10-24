import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Spinner } from './core/components/spinner/spinner';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Spinner],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
