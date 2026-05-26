const authService = require('../services/authService');

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const result = await authService.login(email, password);

  if (!result) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.json(result);
};

const verifyLogin = async (req, res) => {
  const { loginCodeId, code } = req.body;

  if (!loginCodeId || !code) {
    return res.status(400).json({ error: 'Login code id and code are required' });
  }

  const result = await authService.verifyLoginCode(loginCodeId, code);

  if (!result) {
    return res.status(401).json({ error: 'Invalid or expired verification code' });
  }

  const io = req.app.get('io');
  if (io) io.emit('activityLogged');

  res.json(result);
};

const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'Full name, email and password are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const result = await authService.signup(fullName, email, password);

  if (!result) {
    return res.status(409).json({ error: 'User already exists' });
  }

  res.status(201).json(result);
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const result = await authService.forgotPassword(email);
  res.json(result);
};

const resetPassword = async (req, res) => {
  const { resetTokenId, code, newPassword } = req.body;

  if (!resetTokenId || !code || !newPassword) {
    return res.status(400).json({ error: 'Reset token id, code and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const result = await authService.resetPassword(resetTokenId, code, newPassword);

  if (!result) {
    return res.status(401).json({ error: 'Invalid or expired reset code' });
  }

  res.json({ message: 'Password reset successfully' });
};

module.exports = {
  login,
  verifyLogin,
  signup,
  forgotPassword,
  resetPassword
};