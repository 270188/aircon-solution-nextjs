import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Booking } from './Booking';

function renderBooking() {
  return render(
    <MemoryRouter>
      <Booking />
    </MemoryRouter>,
  );
}

async function goToCalendar(container: HTMLElement) {
  fireEvent.click(container.querySelector('.svc') as HTMLButtonElement);
  await act(() => new Promise((r) => setTimeout(r, 300)));
  expect(container.querySelector('.calendar')).toBeTruthy();
}

describe('Booking', () => {
  beforeEach(() => {
    vi.stubGlobal('scrollTo', vi.fn());
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('avanza del servicio a la fecha y consulta la disponibilidad', async () => {
    const fetchMock = vi.fn(async (url: URL) => {
      const date = url.searchParams.get('date');
      return new Response(JSON.stringify({ date, open: true, slots: [{ time: '09:00', available: true }, { time: '10:00', available: false }] }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);
    const { container } = renderBooking();
    await goToCalendar(container);

    await act(async () => {
      fireEvent.click(container.querySelector('.day:not([disabled])') as HTMLButtonElement);
    });
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/v1/bookings/availability');

    const slots = container.querySelectorAll<HTMLButtonElement>('.slot');
    expect(slots.length).toBe(2);
    expect(slots[1].disabled).toBe(true);
    expect(screen.getByText('Ocupado')).toBeTruthy();
  });

  it('muestra horarios referenciales si el servidor no responde', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('sin red'); }));
    const { container } = renderBooking();
    await goToCalendar(container);
    await act(async () => {
      fireEvent.click(container.querySelector('.day:not([disabled])') as HTMLButtonElement);
    });
    expect(container.querySelector('.warn')).toBeTruthy();
    expect(container.querySelectorAll('.slot').length).toBe(9);
  });
});
