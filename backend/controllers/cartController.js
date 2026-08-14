import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

const populateCart = (query) =>
  query.populate({
    path: 'items.product',
    populate: [
      { path: 'brand', select: 'name logo' },
      { path: 'category', select: 'name' },
    ],
  }).populate('items.appliedOffer').populate({ path: 'items.appliedBankDiscount', populate: { path: 'bank' } });

export const getCart = async (req, res) => {
  let cart = await populateCart(Cart.findOne({ user: req.user._id }));

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  res.json(cart);
};

export const addToCart = async (req, res) => {
  const { productId, quantity = 1, offerId, bankDiscountId } = req.body;

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
  let appliedBankDiscount = null;

  if (offerId) {
    if (product.offers && product.offers.some(id => id.toString() === offerId.toString())) {
      const availableSN = await ProductSerialNumber.findOne({ product: productId, status: 'Available' });
      if (availableSN) {
        selectedSerialNumber = availableSN._id;
        appliedOffer = offerId;
      }
    }
  }

  if (bankDiscountId) {
    // Actually we don't strictly require serial number logic just to assign a bank discount in cart
    appliedBankDiscount = bankDiscountId;
  }

  if (itemIndex > -1) {
    cart.items[itemIndex].quantity += quantity;
    if (offerId && appliedOffer) {
      cart.items[itemIndex].selectedSerialNumber = selectedSerialNumber;
      cart.items[itemIndex].appliedOffer = appliedOffer;
    }
    if (bankDiscountId) {
      cart.items[itemIndex].appliedBankDiscount = appliedBankDiscount;
    }
  } else {
    cart.items.push({ 
      product: productId, 
      quantity,
      selectedSerialNumber,
      appliedOffer,
      appliedBankDiscount
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
  
  // If they request more than stock, cap it to available stock
  let newQuantity = req.body.quantity;
  if (newQuantity > product.stock) {
    if (newQuantity > item.quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    } else {
      newQuantity = product.stock;
    }
  }

  // If stock is 0, remove item entirely? 
  // No, let them keep it or we can just cap to 1 and let checkout fail, 
  // but if newQuantity becomes 0 due to capping, remove it.
  if (newQuantity <= 0) {
    cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
  } else {
    item.quantity = newQuantity;
  }
  
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

import ProductBankDiscount from '../models/ProductBankDiscount.js';

export const applyBankDiscount = async (req, res) => {
  const { productId, discountId } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  
  if (!cart) {
    return res.status(404).json({ message: 'Cart not found' });
  }

  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) {
    return res.status(404).json({ message: 'Product not found in cart' });
  }

  if (!discountId) {
    item.appliedBankDiscount = null;
  } else {
    const bankDiscount = await ProductBankDiscount.findById(discountId);
    if (!bankDiscount || bankDiscount.product.toString() !== productId || !bankDiscount.isActive) {
      return res.status(400).json({ message: 'This bank discount is not applicable to this product or is inactive.' });
    }

    item.appliedBankDiscount = discountId;
  }

  await cart.save();
  
  const populated = await populateCart(Cart.findById(cart._id));
  res.json(populated);
};
