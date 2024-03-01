import { Component, EventEmitter, input } from '@angular/core';
import { S3Service } from '../s3.service';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css'],
})
export class FileUploadComponent {
  constructor(private s3Service: S3Service) {}

  async uploadFile(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.s3Service.uploadFile(file).subscribe(() => {
        alert('File uploaded successfully.');
      });
    }
  }
}
