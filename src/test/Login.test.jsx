import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Login from '../pages/Login';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock AuthContext so Login can call login() without a real provider
const mockLogin = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin, token: null, user: null, logout: vi.fn() })
}));

// Mock API config
vi.mock('../config/api', () => ({ API_BASE_URL: 'https://localhost:5443' }));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders email and password inputs and submit button', () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('shows email validation error for invalid email', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText(/enter your email/i), 'notanemail');
    await user.type(screen.getByPlaceholderText(/••••••••/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
  });

  test('shows password validation error when password is too short', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText(/enter your email/i), 'test@gmail.com');
    await user.type(screen.getByPlaceholderText(/••••••••/i), 'abc');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  test('calls fetch and AuthContext.login on successful login', async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'test.jwt.token',
        user: { id: 1, fullName: 'Admin', email: 'admin@gmail.com', role: 'admin', permissions: [] }
      })
    });

    renderLogin();

    await user.type(screen.getByPlaceholderText(/enter your email/i), 'admin@gmail.com');
    await user.type(screen.getByPlaceholderText(/••••••••/i), 'admin1234');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'https://localhost:5443/api/auth/login',
        expect.objectContaining({ method: 'POST' })
      );
      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'admin@gmail.com' }),
        'test.jwt.token'
      );
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('shows error message on invalid credentials (401)', async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 401 });

    renderLogin();

    await user.type(screen.getByPlaceholderText(/enter your email/i), 'admin@gmail.com');
    await user.type(screen.getByPlaceholderText(/••••••••/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('shows server error message on network failure', async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    renderLogin();

    await user.type(screen.getByPlaceholderText(/enter your email/i), 'admin@gmail.com');
    await user.type(screen.getByPlaceholderText(/••••••••/i), 'admin1234');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument();
    });
  });

  test('shows reset message after clicking Forgot Password with valid email', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText(/enter your email/i), 'admin@gmail.com');
    await user.click(screen.getByRole('button', { name: /forgot password/i }));

    expect(screen.getByText(/password reset email sent/i)).toBeInTheDocument();
  });

  test('shows error if Forgot Password clicked with empty email', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /forgot password/i }));

    expect(screen.getByText(/please enter your email first/i)).toBeInTheDocument();
  });
});
