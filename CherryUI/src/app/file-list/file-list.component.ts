import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { S3Service } from '../s3.service';
import { FileUpdateService } from '../file-update.service'; // Import the service
import _ from 'lodash';
@Component({
  selector: 'app-file-list',
  templateUrl: './file-list.component.html',
  styleUrls: ['./file-list.component.css'],
})
export class FileListComponent implements OnInit {
  files: string[] = [];
  @Output() fileSelected = new EventEmitter<string>();
  selectedFileKey: string = '';

  constructor(
    private s3Service: S3Service,
    private fileUpdateService: FileUpdateService
  ) {}

  ngOnInit(): void {
    this.s3Service.listFiles().subscribe((data) => {
      this.files = data.map((x) => x.toString());
    });

    // Subscribe to file upload notifications
    this.fileUpdateService.fileUploaded$.subscribe((fileName) => {
      this.pushNewFile(fileName, true); // Assuming you want to select the new file as well
    });
  }

  onFileSelect(event: any): void {
    const fileKey: string = event.target.value;
    if (fileKey) {
      this.s3Service.getPresignedUrl(fileKey).subscribe((data) => {
        this.fileSelected.emit(data.PreSignedUrl);
      });
    }
  }

  pushNewFile(fileName: string, selectAfterAdding: boolean = false): void {
    this.files.push(fileName);
    this.files = _.uniq(this.files);
    if (selectAfterAdding) {
      this.s3Service.getPresignedUrl(fileName).subscribe((data) => {
        this.fileSelected.emit(data.PreSignedUrl);
        this.selectedFileKey = fileName;
      });
    }
  }
}
