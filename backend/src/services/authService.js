const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  User,
  Role,
  Permission,
  ActivityLog,
  LoginCode,
  PasswordResetToken
} = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';
const SALT_ROUNDS = 10;

const generateCode = () => String(Math.floor(100000 + Math.random() * 900000));

const signToken = (user) => {
  const permissions = user.Role.Permissions.map((p) => p.name);

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.Role.name,
      permissions
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const formatUser = (user) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  role: user.Role.name,
  permissions: user.Role.Permissions.map((p) => p.name)
});

const login = async (email, password) => {
  const user = await User.findOne({
    where: { email },
    include: { model: Role, include: Permission }
  });

  if (!user) return null;

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) return null;

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const loginCode = await LoginCode.create({
    userId: user.id,
    code,
    expiresAt,
    used: false
  });

  return {
    requiresVerification: true,
    loginCodeId: loginCode.id,
    email: user.email,
    demoCode: code
  };
};

const verifyLoginCode = async (loginCodeId, code) => {
  const loginCode = await LoginCode.findByPk(loginCodeId);

  if (!loginCode) return null;
  if (loginCode.used) return null;
  if (loginCode.code !== code) return null;
  if (new Date(loginCode.expiresAt) < new Date()) return null;

  loginCode.used = true;
  await loginCode.save();

  const user = await User.findByPk(loginCode.userId, {
    include: { model: Role, include: Permission }
  });

  if (!user) return null;

  await ActivityLog.create({
    userId: user.id,
    action: 'APP_LOGIN',
    details: `${user.email} completed 3-way authentication`
  });

  return {
    token: signToken(user),
    user: formatUser(user)
  };
};

const signup = async (fullName, email, password) => {
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) return null;

  const userRole = await Role.findOne({ where: { name: 'user' } });
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const newUser = await User.create({
    fullName,
    email,
    password: hashedPassword,
    roleId: userRole.id
  });

  const createdUser = await User.findByPk(newUser.id, {
    include: { model: Role, include: Permission }
  });

  return {
    token: signToken(createdUser),
    user: formatUser(createdUser)
  };
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ where: { email } });

  if (!user) {
    return {
      success: true,
      message: 'If this email exists, a recovery code was generated.'
    };
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const resetToken = await PasswordResetToken.create({
    userId: user.id,
    code,
    expiresAt,
    used: false
  });

  return {
    success: true,
    resetTokenId: resetToken.id,
    email: user.email,
    demoCode: code,
    message: 'Password recovery code generated.'
  };
};

const resetPassword = async (resetTokenId, code, newPassword) => {
  const resetToken = await PasswordResetToken.findByPk(resetTokenId);

  if (!resetToken) return null;
  if (resetToken.used) return null;
  if (resetToken.code !== code) return null;
  if (new Date(resetToken.expiresAt) < new Date()) return null;

  const user = await User.findByPk(resetToken.userId);
  if (!user) return null;

  user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();

  resetToken.used = true;
  await resetToken.save();

  return true;
};

module.exports = {
  login,
  verifyLoginCode,
  signup,
  forgotPassword,
  resetPassword
};