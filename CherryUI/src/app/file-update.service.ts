import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FileUpdateService {
  private fileUploadedSource = new Subject<string>();
  fileUploaded$ = this.fileUploadedSource.asObservable();

  fileUploaded(fileName: string) {
    this.fileUploadedSource.next(fileName);
  }
}
