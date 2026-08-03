import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';

export const register = async (req, res) => {
  const { name, email, password, phone } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists with this email' });
  }

  const user = await User.create({ name, email, password, phone });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    token: generateToken(user._id),
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  if (user.isBlocked) {
    return res.status(403).json({ message: 'Your account has been blocked' });
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    token: generateToken(user._id),
  });
};

export const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json(user);
};

export const updateProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      addresses: updatedUser.addresses,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

export const forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(404).json({ message: 'No user found with that email' });
  }

  // Generate 6-digit OTP
  const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
  
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  await user.save();

  try {
    const message = `Your password reset OTP is: ${resetToken}\n\nThis OTP is valid for 10 minutes.\nIf you have not requested this email, then please ignore it.`;

    await sendEmail({
      email: user.email,
      subject: 'Password Reset OTP',
      message,
    });

    res.json({
      message: 'OTP sent to your email',
      // resetToken, // Removed from response for security
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    
    // Fallback: If email fails, you can console log it for local dev without SMTP
    console.error('Email sending failed:', error);
    res.status(500).json({ message: 'Email could not be sent. Check backend logs or SMTP config.' });
  }
};

export const resetPassword = async (req, res) => {
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.body.token)
    .digest('hex');

  const user = await User.findOne({
    email: req.body.email,
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired OTP, or wrong email' });
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({
    message: 'Password reset successful',
    token: generateToken(user._id),
  });
};

export const addAddress = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (req.body.isDefault) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
  }

  user.addresses.push(req.body);
  await user.save();
  res.status(201).json(user.addresses);
};

export const updateAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);

  if (!address) {
    return res.status(404).json({ message: 'Address not found' });
  }

  Object.assign(address, req.body);

  if (req.body.isDefault) {
    user.addresses.forEach((addr) => {
      if (addr._id.toString() !== req.params.addressId) {
        addr.isDefault = false;
      }
    });
  }

  await user.save();
  res.json(user.addresses);
};

export const deleteAddress = async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses.pull(req.params.addressId);
  await user.save();
  res.json(user.addresses);
};
