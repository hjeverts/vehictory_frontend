import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  MaintenanceAttachment,
  MaintenanceEntry,
  MaintenanceEntryRequest,
  MaintenanceType,
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  constructor(private http: HttpClient) {}

  private baseUrl(vehicleId: number): string {
    return `${environment.apiUrl}/vehicles/${vehicleId}/maintenance`;
  }

  getAll(vehicleId: number): Observable<MaintenanceEntry[]> {
    return this.http.get<MaintenanceEntry[]>(this.baseUrl(vehicleId));
  }

  create(vehicleId: number, entry: MaintenanceEntryRequest): Observable<MaintenanceEntry> {
    return this.http.post<MaintenanceEntry>(this.baseUrl(vehicleId), entry);
  }

  update(vehicleId: number, id: number, entry: MaintenanceEntryRequest): Observable<MaintenanceEntry> {
    return this.http.put<MaintenanceEntry>(`${this.baseUrl(vehicleId)}/${id}`, entry);
  }

  delete(vehicleId: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl(vehicleId)}/${id}`);
  }

  getTypes(): Observable<MaintenanceType[]> {
    return this.http.get<MaintenanceType[]>(`${environment.apiUrl}/maintenance-types`);
  }

  createType(naam: string): Observable<MaintenanceType> {
    return this.http.post<MaintenanceType>(`${environment.apiUrl}/maintenance-types`, { naam });
  }

  uploadAttachment(vehicleId: number, entryId: number, file: File): Observable<MaintenanceAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<MaintenanceAttachment>(
      `${this.baseUrl(vehicleId)}/${entryId}/attachments`,
      formData,
    );
  }

  deleteAttachment(vehicleId: number, entryId: number, attachmentId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl(vehicleId)}/${entryId}/attachments/${attachmentId}`);
  }

  // Blob-fetch i.p.v. een kale <a href>/<img src>: deze endpoints staan achter JWT-auth, die de
  // interceptor alleen aan HttpClient-requests toevoegt, niet aan directe browsernavigatie.
  downloadAttachment(vehicleId: number, entryId: number, attachmentId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl(vehicleId)}/${entryId}/attachments/${attachmentId}`, {
      responseType: 'blob',
    });
  }
}
