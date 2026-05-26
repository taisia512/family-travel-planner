import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from '../components/Pagination';

describe('Pagination', () => {
  it('renders pages', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={3}
        onPageChange={() => {}}
        totalItems={9}
        itemsPerPage={3}
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('changes page', async () => {
    const user = userEvent.setup();
    const fn = vi.fn();

    render(
      <Pagination
        currentPage={1}
        totalPages={3}
        onPageChange={fn}
        totalItems={9}
        itemsPerPage={3}
      />
    );

    await user.click(screen.getByText('2'));

    expect(fn).toHaveBeenCalledWith(2);
  });
});
