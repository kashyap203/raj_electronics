import User from '../models/User.js';

export const getAllUsers = async (req, res) => {
  const users = await User.find({ role: 'customer' })
    .select('-password')
    .sort({ createdAt: -1 });
  res.json(users);
};

export const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user);
};

export const updateUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  user.phone = req.body.phone || user.phone;
  if (req.body.role) user.role = req.body.role;
  if (req.body.isBlocked !== undefined) user.isBlocked = req.body.isBlocked;

  const updated = await user.save();
  res.json({
    _id: updated._id,
    name: updated.name,
    email: updated.email,
    phone: updated.phone,
    role: updated.role,
    isBlocked: updated.isBlocked,
  });
};

export const blockUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.isBlocked = !user.isBlocked;
  await user.save();

  res.json({
    message: user.isBlocked ? 'User blocked' : 'User unblocked',
    isBlocked: user.isBlocked,
  });
};

export const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  await user.deleteOne();
  res.json({ message: 'User removed' });
};
