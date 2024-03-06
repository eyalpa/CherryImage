import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // Import FormsModule

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FileListComponent } from './file-list/file-list.component';

import { FileUploadComponent } from './file-upload/file-upload.component';
import { ThreeViewerComponent } from './three-viewer/three-viewer.component';

@NgModule({
  declarations: [
    AppComponent,
    FileListComponent,
    FileUploadComponent,
    ThreeViewerComponent,
  ],
  imports: [BrowserModule, HttpClientModule, AppRoutingModule, FormsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
