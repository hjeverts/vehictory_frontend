import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Vehicle, VehicleRequest, VehicleShare, VehicleStats } from '../models/models';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly baseUrl = `${environment.apiUrl}/vehicles`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(this.baseUrl);
  }

  getById(id: number): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${this.baseUrl}/${id}`);
  }

  // Blob-fetch i.p.v. een kale <img src>: dit endpoint staat achter JWT-auth, die de
  // interceptor alleen aan HttpClient-requests toevoegt, niet aan directe browsernavigatie.
  getPhoto(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/photo`, { responseType: 'blob' });
  }

  create(vehicle: VehicleRequest): Observable<Vehicle> {
    return this.http.post<Vehicle>(this.baseUrl, vehicle);
  }

  update(id: number, vehicle: VehicleRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, vehicle);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  updatePhoto(id: number, file: File): Observable<Vehicle> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.put<Vehicle>(`${this.baseUrl}/${id}/photo`, formData);
  }

  getStats(id: number): Observable<VehicleStats> {
    return this.http.get<VehicleStats>(`${this.baseUrl}/${id}/stats`);
  }

  getShares(vehicleId: number): Observable<VehicleShare[]> {
    return this.http.get<VehicleShare[]>(`${this.baseUrl}/${vehicleId}/shares`);
  }

  addShare(vehicleId: number, email: string): Observable<VehicleShare> {
    return this.http.post<VehicleShare>(`${this.baseUrl}/${vehicleId}/shares`, { email });
  }

  removeShare(vehicleId: number, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${vehicleId}/shares/${userId}`);
  }
}
