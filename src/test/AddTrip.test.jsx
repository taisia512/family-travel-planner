import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import AddTrip from '../pages/AddTrip';

describe('AddTrip', () => {
  it('shows validation errors when form is submitted empty', () => {
    render(
      <MemoryRouter>
        <AddTrip onAddTrip={vi.fn()} />
      </MemoryRouter>
    );

    const form = screen.getByRole('button', { name: /confirm/i }).closest('form');
    fireEvent.submit(form);

    expect(screen.getByText(/country is required/i)).toBeInTheDocument();
    expect(screen.getByText(/city is required/i)).toBeInTheDocument();
    expect(screen.getByText(/start date is required/i)).toBeInTheDocument();
    expect(screen.getByText(/end date is required/i)).toBeInTheDocument();
    expect(screen.getByText(/number of travelers is required/i)).toBeInTheDocument();
  });

  it('submits correctly', async () => {
    const user = userEvent.setup();
    const fn = vi.fn();

    render(
      <MemoryRouter>
        <AddTrip onAddTrip={fn} />
      </MemoryRouter>
    );

    await user.selectOptions(screen.getByLabelText(/country/i), 'Greece');
    await user.selectOptions(screen.getByLabelText(/city/i), 'Zakynthos');
    await user.type(screen.getByLabelText(/start date/i), '2026-03-23');
    await user.type(screen.getByLabelText(/end date/i), '2026-03-25');
    await user.type(screen.getByLabelText(/travelers/i), '2');

    await user.click(screen.getByRole('button', { name: /confirm/i }));

    expect(fn).toHaveBeenCalledWith({
      country: 'Greece',
      city: 'Zakynthos',
      startDate: '2026-03-23',
      endDate: '2026-03-25',
      travelers: 2
    });
  });
});
