import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

const populateCart = (query) =>
  query.populate({
    path: 'items.product',
    populate: [
      { path: 'brand', select: 'name logo' },
      { path: 'category', select: 'name' },
    ],
  }).populate('appliedOffer');

export const getCart = async (req, res) => {
  let cart = await populateCart(Cart.findOne({ user: req.user._id }));

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  res.json(cart);
};

export const addToCart = async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  if (product.stock < quantity) {
    return res.status(400).json({ message: 'Insufficient stock' });
  }

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (itemIndex > -1) {
    cart.items[itemIndex].quantity += quantity;
  } else {
    cart.items.push({ product: productId, quantity });
  }

  await cart.save();
  cart = await populateCart(Cart.findById(cart._id));
  res.json(cart);
};

export const updateCartItem = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  const item = cart.items.find(
    (i) => i.product.toString() === req.params.productId
  );

  if (!item) {
    return res.status(404).json({ message: 'Item not found in cart' });
  }

  const product = await Product.findById(req.params.productId);
  if (product.stock < req.body.quantity) {
    return res.status(400).json({ message: 'Insufficient stock' });
  }

  item.quantity = req.body.quantity;
  await cart.save();

  const populated = await populateCart(Cart.findById(cart._id));
  res.json(populated);
};

export const removeFromCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== req.params.productId
  );

  await cart.save();
  const populated = await populateCart(Cart.findById(cart._id));
  res.json(populated);
};

export const clearCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  res.json({ message: 'Cart cleared' });
};

export const applyOffer = async (req, res) => {
  const { offerId } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  
  if (!cart) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  cart.appliedOffer = offerId || null;
  await cart.save();
  
  const populated = await populateCart(Cart.findById(cart._id));
  res.json(populated);
};
