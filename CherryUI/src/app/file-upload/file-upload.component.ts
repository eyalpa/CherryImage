import { Component } from '@angular/core';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { S3Service } from '../s3.service';
import { FileUpdateService } from '../file-update.service'; // Ensure you import the new service

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css'],
})
export class FileUploadComponent {
  constructor(
    private s3Service: S3Service,
    private fileUpdateService: FileUpdateService
  ) {}
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length) {
      const file: File = input.files[0];
      // Now call your service to upload the file
      this.uploadFile(file);
    }
  }
  uploadFile(file: File) {
    this.s3Service.uploadFile(file).subscribe(
      (event: any) => {
        if (event instanceof HttpResponse) {
          // Upload is complete
          console.log('File is completely uploaded!');
          this.fileUpdateService.fileUploaded(file.name);
        }
      },
      (error: any) => {
        console.error('Upload error:', error);
      }
    );
  }
}
