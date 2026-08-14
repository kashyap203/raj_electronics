import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

const populateCart = (query) =>
  query.populate({
    path: 'items.product',
    populate: [
      { path: 'brand', select: 'name logo' },
      { path: 'category', select: 'name' },
    ],
  }).populate('items.appliedOffer');

export const getCart = async (req, res) => {
  let cart = await populateCart(Cart.findOne({ user: req.user._id }));

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  res.json(cart);
};

export const addToCart = async (req, res) => {
  const { productId, quantity = 1, offerId } = req.body;

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

  let selectedSerialNumber = null;
  let appliedOffer = null;

  if (offerId) {
    if (product.offers && product.offers.some(id => id.toString() === offerId.toString())) {
      const availableSN = await ProductSerialNumber.findOne({ product: productId, status: 'Available' });
      if (availableSN) {
        selectedSerialNumber = availableSN._id;
        appliedOffer = offerId;
      }
    }
  }

  if (itemIndex > -1) {
    cart.items[itemIndex].quantity += quantity;
    if (offerId && appliedOffer) {
      cart.items[itemIndex].selectedSerialNumber = selectedSerialNumber;
      cart.items[itemIndex].appliedOffer = appliedOffer;
    }
  } else {
    cart.items.push({ 
      product: productId, 
      quantity,
      selectedSerialNumber,
      appliedOffer
    });
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

import ProductSerialNumber from '../models/ProductSerialNumber.js';

export const applyOffer = async (req, res) => {
  const { productId, offerId } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  
  if (!cart) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) {
    return res.status(404).json({ message: 'Product not found in cart' });
  }

  if (!offerId) {
    item.appliedOffer = null;
    item.selectedSerialNumber = null; // optional, but better to reset
  } else {
    const product = await Product.findById(productId);
    if (!product || !product.offers || !product.offers.some(id => id.toString() === offerId.toString())) {
      return res.status(400).json({ message: 'This offer is not applicable to this product' });
    }

    // Find available serial number
    const availableSN = await ProductSerialNumber.findOne({ product: productId, status: 'Available' });
    if (!availableSN) {
      return res.status(400).json({ message: 'No available items for this product to apply the offer' });
    }

    item.selectedSerialNumber = availableSN._id;
    item.appliedOffer = offerId;
  }

  await cart.save();
  
  const populated = await populateCart(Cart.findById(cart._id));
  res.json(populated);
};
