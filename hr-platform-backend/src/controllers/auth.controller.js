const authService = require('../services/auth.service');
const logger = require('../utils/logger');

async function register(req, res, next) {
  try {
    const user = await authService.registerUser(req.body);
    logger.info(`New user registered: ${user.email}`);
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.loginUser(req.body);
    logger.info(`User logged in: ${result.user.email}`);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    await authService.changePassword(req.user.userId, req.body.currentPassword, req.body.newPassword);
    logger.info(`Password changed for user ${req.user.userId}`);
    res.status(200).json({ message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    await authService.requestPasswordReset(req.body.email);
    res.status(200).json({ message: 'If that email exists in our system, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    await authService.resetPassword(req.body.token, req.body.newPassword);
    res.status(200).json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, changePassword, forgotPassword, resetPassword };
