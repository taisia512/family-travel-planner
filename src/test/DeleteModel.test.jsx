import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeleteModal from '../components/DeleteModal';

describe('DeleteModal', () => {
  it('does not render when closed', () => {
    render(<DeleteModal isOpen={false} onCancel={() => {}} onConfirm={() => {}} />);

    expect(screen.queryByText(/delete trip/i)).not.toBeInTheDocument();
  });

  it('renders when open', () => {
    render(<DeleteModal isOpen={true} onCancel={() => {}} onConfirm={() => {}} />);

    expect(screen.getByText(/delete trip/i)).toBeInTheDocument();
  });

  it('calls confirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(<DeleteModal isOpen={true} onCancel={() => {}} onConfirm={onConfirm} />);

    await user.click(screen.getByText(/confirm/i));

    expect(onConfirm).toHaveBeenCalled();
  });
});
