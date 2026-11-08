import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { BookingComponent } from './booking.component';

describe('BookingComponent', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BookingComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  it('avanza del servicio a la fecha y consulta la disponibilidad', async () => {
    const fixture = TestBed.createComponent(BookingComponent);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;

    (el.querySelector('.svc') as HTMLButtonElement).click();
    await new Promise((r) => setTimeout(r, 300));
    await fixture.whenStable();
    expect(el.querySelector('.calendar')).toBeTruthy();

    (el.querySelector('.day:not([disabled])') as HTMLButtonElement).click();
    const req = http.expectOne((r) => r.url === '/api/v1/bookings/availability');
    req.flush({ date: req.request.params.get('date'), open: true, slots: [{ time: '09:00', available: true }, { time: '10:00', available: false }] });
    await fixture.whenStable();

    const slots = el.querySelectorAll<HTMLButtonElement>('.slot');
    expect(slots.length).toBe(2);
    expect(slots[1].disabled).toBe(true);
  });

  it('muestra horarios referenciales si el servidor no responde', async () => {
    const fixture = TestBed.createComponent(BookingComponent);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    (el.querySelector('.svc') as HTMLButtonElement).click();
    await new Promise((r) => setTimeout(r, 300));
    await fixture.whenStable();
    (el.querySelector('.day:not([disabled])') as HTMLButtonElement).click();
    http.expectOne((r) => r.url === '/api/v1/bookings/availability').error(new ProgressEvent('error'));
    await fixture.whenStable();
    expect(el.querySelector('.warn')).toBeTruthy();
    expect(el.querySelectorAll('.slot').length).toBe(9);
  });
});
