import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Signup from '../pages/Signup';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockLogin = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin, token: null, user: null, logout: vi.fn() })
}));

vi.mock('../config/api', () => ({ API_BASE_URL: 'https://localhost:5443' }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderSignup() {
  return render(
    <MemoryRouter>
      <Signup />
    </MemoryRouter>
  );
}

async function fillForm(user, { fullName, email, password, confirmPassword }) {
  if (fullName !== undefined)
    await user.type(screen.getByPlaceholderText(/enter your full name/i), fullName);
  if (email !== undefined)
    await user.type(screen.getByPlaceholderText(/enter your email/i), email);
  if (password !== undefined)
    await user.type(screen.getByPlaceholderText(/create a password/i), password);
  if (confirmPassword !== undefined)
    await user.type(screen.getByPlaceholderText(/confirm your password/i), confirmPassword);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Signup page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders all form fields', () => {
    renderSignup();
    expect(screen.getByPlaceholderText(/enter your full name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/create a password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/confirm your password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  test('shows all validation errors on empty submit', async () => {
    const user = userEvent.setup();
    renderSignup();

    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument();
  });

  test('shows error for short full name', async () => {
    const user = userEvent.setup();
    renderSignup();

    await fillForm(user, {
      fullName: 'AB',
      email: 'test@gmail.com',
      password: 'password1',
      confirmPassword: 'password1'
    });
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
  });

  test('shows error for non-allowed email domain', async () => {
    const user = userEvent.setup();
    renderSignup();

    await fillForm(user, {
      fullName: 'Test User',
      email: 'test@hotmail.com',
      password: 'password1',
      confirmPassword: 'password1'
    });
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText(/gmail\.com, yahoo\.com or outlook\.com/i)).toBeInTheDocument();
  });

  test('shows error for mismatched passwords', async () => {
    const user = userEvent.setup();
    renderSignup();

    await fillForm(user, {
      fullName: 'Test User',
      email: 'test@gmail.com',
      password: 'password1',
      confirmPassword: 'password2'
    });
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  test('calls fetch and AuthContext.login on valid form submission', async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        token: 'new.jwt.token',
        user: {
          id: 2,
          fullName: 'Test User',
          email: 'test@gmail.com',
          role: 'user',
          permissions: []
        }
      })
    });

    renderSignup();

    await fillForm(user, {
      fullName: 'Test User',
      email: 'test@gmail.com',
      password: 'password1',
      confirmPassword: 'password1'
    });
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'https://localhost:5443/api/auth/signup',
        expect.objectContaining({ method: 'POST' })
      );
      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@gmail.com' }),
        'new.jwt.token'
      );
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('shows error on duplicate email (409)', async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 409 });

    renderSignup();

    await fillForm(user, {
      fullName: 'Test User',
      email: 'admin@gmail.com',
      password: 'password1',
      confirmPassword: 'password1'
    });
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('shows server error on network failure', async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    renderSignup();

    await fillForm(user, {
      fullName: 'Test User',
      email: 'test@gmail.com',
      password: 'password1',
      confirmPassword: 'password1'
    });
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument();
    });
  });
});
