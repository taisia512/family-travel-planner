import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import EditTrip from '../pages/EditTrip';

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

describe('EditTrip', () => {
  it('loads data', () => {
    render(
      <MemoryRouter initialEntries={['/edit-trip/1']}>
        <Routes>
          <Route path="/edit-trip/:id" element={<EditTrip trips={trips} onUpdateTrip={() => {}} />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByDisplayValue('Greece')).toBeInTheDocument();
  });

  it('updates trip', async () => {
    const user = userEvent.setup();
    const fn = vi.fn();

    render(
      <MemoryRouter initialEntries={['/edit-trip/1']}>
        <Routes>
          <Route path="/edit-trip/:id" element={<EditTrip trips={trips} onUpdateTrip={fn} />} />
        </Routes>
      </MemoryRouter>
    );

    await user.clear(screen.getByLabelText(/travelers/i));
    await user.type(screen.getByLabelText(/travelers/i), '5');

    await user.click(screen.getByText(/confirm/i));

    expect(fn).toHaveBeenCalled();
  });
});
