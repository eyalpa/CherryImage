import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { S3Service } from '../s3.service';

@Component({
  selector: 'app-file-list',
  templateUrl: './file-list.component.html',
  styleUrls: ['./file-list.component.css'],
})
export class FileListComponent implements OnInit {
  files: string[] = [];
  @Output() fileSelected = new EventEmitter<string>();

  constructor(private s3Service: S3Service) {}

  ngOnInit(): void {
    this.s3Service.listFiles().subscribe((data) => {
      this.files = data.map((x) => x.toString());
    });
  }

  onFileSelect(event: any): void {
    const fileKey: string = event.target.value;
    if (fileKey) {
      const ret = this.s3Service.getPresignedUrl(fileKey).subscribe((data) => {
        this.fileSelected.emit(data.PreSignedUrl);
      });
    }
  }
}
