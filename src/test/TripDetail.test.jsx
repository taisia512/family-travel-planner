import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import TripDetail from '../pages/TripDetail';

const trips = [
  {
    id: 1,
    country: 'Greece',
    city: 'Zakynthos',
    startDate: '2026-03-23',
    endDate: '2026-03-25',
    travelers: 3
  }
];

describe('TripDetail', () => {
  it('renders details', () => {
    render(
      <MemoryRouter initialEntries={['/trip/1']}>
        <Routes>
          <Route path="/trip/:id" element={<TripDetail trips={trips} />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Greece')).toBeInTheDocument();
  });

  it('not found', () => {
    render(
      <MemoryRouter initialEntries={['/trip/999']}>
        <Routes>
          <Route path="/trip/:id" element={<TripDetail trips={trips} />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/trip not found/i)).toBeInTheDocument();
  });
});
