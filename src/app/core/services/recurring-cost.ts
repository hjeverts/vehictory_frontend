import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RecurringCost, RecurringCostRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class RecurringCostService {
  constructor(private http: HttpClient) {}

  private baseUrl(vehicleId: number): string {
    return `${environment.apiUrl}/vehicles/${vehicleId}/recurring-costs`;
  }

  getAll(vehicleId: number): Observable<RecurringCost[]> {
    return this.http.get<RecurringCost[]>(this.baseUrl(vehicleId));
  }

  create(vehicleId: number, cost: RecurringCostRequest): Observable<RecurringCost> {
    return this.http.post<RecurringCost>(this.baseUrl(vehicleId), cost);
  }

  update(vehicleId: number, id: number, cost: RecurringCostRequest): Observable<RecurringCost> {
    return this.http.put<RecurringCost>(`${this.baseUrl(vehicleId)}/${id}`, cost);
  }

  delete(vehicleId: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl(vehicleId)}/${id}`);
  }
}
