import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class S3Service {
  private apiUrl =
    'https://bzhhof9s36.execute-api.us-east-1.amazonaws.com/PROD/CherryImageNodeJS';

  constructor(private http: HttpClient) {}

  listFiles(): Observable<S3File[]> {
    return this.http.get<S3File[]>(`${this.apiUrl}`);
  }

  getPresignedUrl(fileKey: string): Observable<PresignedUrlResponse> {
    return this.http.get<PresignedUrlResponse>(
      `${this.apiUrl}?file=${fileKey}`
    );
  }

  uploadFile(file: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post(`${this.apiUrl}?file=${file.name}`, formData, {
      reportProgress: true,
      observe: 'events',
    });
  }
}

export interface S3File {
  Key: string;
  LastModified: string;
  ETag: string;
  Size: number;
  StorageClass: string;
}

export interface PresignedUrlResponse {
  PreSignedUrl: string;
}
