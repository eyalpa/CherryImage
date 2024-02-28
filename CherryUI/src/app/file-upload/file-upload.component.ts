import { Component } from '@angular/core';
import { S3Service } from '../s3.service';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css'],
})
export class FileUploadComponent {
  constructor(private s3Service: S3Service) {}

  uploadFile(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.s3Service.getPresignedUrl(file.name).subscribe((urlData) => {
        this.s3Service.uploadFile(file, urlData.PreSignedUrl).subscribe(() => {
          alert('File uploaded successfully.');
        });
      });
    }
  }
}
