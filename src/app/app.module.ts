import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';

import { AppComponent } from './app.component';
import { routes } from './app.routes';

import { HomeComponent } from './home/home.component';
import { AnalysisComponent } from './analysis/analysis.component';
import { ScanBodyComponent } from './scan-body/scan-body.component';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    AnalysisComponent,
    ScanBodyComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes),
    CommonModule,
    FormsModule
  ],
  providers: [provideHttpClient()],
  bootstrap: [AppComponent],
})
export class AppModule {}
