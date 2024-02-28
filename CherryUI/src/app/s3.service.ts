import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class S3Service {
  private apiUrl =
    'https://p34k546geh.execute-api.us-east-1.amazonaws.com/default/CherryImage';

  constructor(private http: HttpClient) {}

  listFiles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/`);
  }

  getPresignedUrl(fileKey: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/presigned-url?objectKey=${fileKey}`);
  }

  uploadFile(fileContent: Blob, presignedUrl: string): Observable<any> {
    return this.http.put(presignedUrl, fileContent);
  }
}
