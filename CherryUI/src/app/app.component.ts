import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  // This property will hold the URL of the selected 3D model
  modelUrl: string = '';

  // This method will be triggered when a file is selected from the list
  onFileSelected(url: string): void {
    // Update the modelUrl with the presigned URL received from the file list component
    this.modelUrl = url;
  }
}
