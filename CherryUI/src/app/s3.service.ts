import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  catchError,
  firstValueFrom,
  from,
  switchMap,
  throwError,
} from 'rxjs';

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

  getPresignedUrl(
    fileKey: string,
    method: string = 'GET'
  ): Observable<PresignedUrlResponse> {
    return this.http.get<PresignedUrlResponse>(
      `${this.apiUrl}?file=${fileKey}&method=${method}`
    );
  }

  uploadFileOld(file: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post(`${this.apiUrl}?file=${file.name}`, formData, {
      reportProgress: true,
      observe: 'events',
    });
  }
  uploadFile(file: File): Observable<any> {
    // Convert the Observable to a Promise to await it
    const presignedUrlPromise = firstValueFrom(
      this.getPresignedUrl(file.name, 'PUT')
    );
    // Use from to convert the Promise back to an Observable, then use switchMap to handle the async URL retrieval
    return from(presignedUrlPromise).pipe(
      switchMap((response) => {
        // Now we have the URL, proceed with the upload
        return this.http.put(response.PreSignedUrl, file, {
          headers: {
            'Content-Type': 'model/gltf-binary', // Important to set this correctly for S3 to accept the file
          },
          reportProgress: true,
          observe: 'events',
        });
      }),
      catchError((error) => {
        // Handle any errors here
        console.error('Upload failed', error);
        return throwError(() => new Error('Upload failed'));
      })
    );
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
