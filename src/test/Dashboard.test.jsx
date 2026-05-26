import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Dashboard from '../pages/Dashboard';

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

describe('Dashboard', () => {
  it('renders trips', () => {
    render(
      <MemoryRouter>
        <Dashboard trips={trips} onDeleteTrip={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getByText('Greece')).toBeInTheDocument();
  });

  it('delete flow works', async () => {
    const user = userEvent.setup();
    const fn = vi.fn();

    render(
      <MemoryRouter>
        <Dashboard trips={trips} onDeleteTrip={fn} />
      </MemoryRouter>
    );

    await user.click(screen.getByTitle(/delete/i));
    await user.click(screen.getByText(/confirm/i));

    expect(fn).toHaveBeenCalled();
  });
});
