import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToolbarComponent } from './layout/toolbar/toolbar.component';
import { FooterComponent } from './layout/footer/footer.component';
import { ResearchAssistantComponent } from './layout/research-assistant/research-assistant.component';

@Component({
  imports: [RouterModule, ToolbarComponent, FooterComponent, ResearchAssistantComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
