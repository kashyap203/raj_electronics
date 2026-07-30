import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import DeliveryCity from '../models/DeliveryCity.js';

export const createOrder = async (req, res) => {
  const { orderItems, address, paymentMethod = 'Cash on Delivery', couponCode } = req.body;

  if (!orderItems?.length) {
    return res.status(400).json({ message: 'No order items' });
  }

  let itemsPrice = 0;
  const products = [];

  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    if (!product) {
      return res.status(404).json({ message: `Product not found: ${item.product}` });
    }
    if (product.stock < item.quantity) {
      return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
    }

    const price = Math.round(product.price - (product.price * product.discount) / 100);
    itemsPrice += price * item.quantity;

    products.push({
      product: product._id,
      name: product.name,
      image: product.images[0] || '',
      price: product.price,
      discount: product.discount,
      quantity: item.quantity,
    });

    product.stock -= item.quantity;
    product.salesCount += item.quantity;
    await product.save();
  }

  let shippingPrice = 99; // Standard shipping
  if (address && address.city) {
    const isFreeDelivery = await DeliveryCity.findOne({ 
      cityName: { $regex: new RegExp(`^${address.city}$`, 'i') } 
    });
    
    if (isFreeDelivery) {
      shippingPrice = 0;
    }
  }

  let couponDiscount = 0;
  if (couponCode === 'DISCOUNT10') {
    couponDiscount = Math.round(itemsPrice * 0.1);
  }

  const total = itemsPrice - couponDiscount + shippingPrice;

  const order = await Order.create({
    user: req.user._id,
    products,
    itemsPrice,
    shippingPrice,
    couponCode: couponCode === 'DISCOUNT10' ? couponCode : null,
    couponDiscount,
    total,
    address,
    paymentMethod,
  });

  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

  res.status(201).json(order);
};

export const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate('products.product', 'name images slug')
    .sort({ createdAt: -1 });
  res.json(orders);
};

export const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('products.product', 'name images slug brand category');

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  res.json(order);
};

export const cancelOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  if (order.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  if (['Shipped', 'Delivered', 'Cancelled'].includes(order.status)) {
    return res.status(400).json({ message: `Cannot cancel order with status: ${order.status}` });
  }

  for (const item of order.products) {
    const product = await Product.findById(item.product);
    if (product) {
      product.stock += item.quantity;
      product.salesCount = Math.max(0, product.salesCount - item.quantity);
      await product.save();
    }
  }

  order.status = 'Cancelled';
  await order.save();
  res.json(order);
};

export const getAllOrders = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const orders = await Order.find(filter)
    .populate('user', 'name email phone')
    .populate('products.product', 'name images')
    .sort({ createdAt: -1 });

  res.json(orders);
};

export const updateOrderStatus = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  order.status = req.body.status;

  if (req.body.status === 'Delivered') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.isPaid = true;
    order.paidAt = Date.now();
  }

  await order.save();
  res.json(order);
};

export const getSalesSummary = async (req, res) => {
  const orders = await Order.find({ status: { $ne: 'Cancelled' } });

  const totalSales = orders.reduce((acc, order) => acc + order.total, 0);
  const totalOrders = orders.length;
  const pendingOrders = await Order.countDocuments({ status: 'Pending' });
  const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });

  const monthlySales = {};
  orders.forEach((order) => {
    const month = new Date(order.createdAt).toLocaleString('default', {
      month: 'short',
      year: 'numeric',
    });
    monthlySales[month] = (monthlySales[month] || 0) + order.total;
  });

  res.json({
    totalSales,
    totalOrders,
    pendingOrders,
    deliveredOrders,
    monthlySales,
  });
};
