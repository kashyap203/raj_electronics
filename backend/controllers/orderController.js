import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import DeliveryCity from '../models/DeliveryCity.js';
import ProductSerialNumber from '../models/ProductSerialNumber.js';
import OfferEligibility from '../models/OfferEligibility.js';
import Offer from '../models/Offer.js';
import { sendOrderStatusNotification } from '../utils/notificationService.js';
import mongoose from 'mongoose';

export const createOrder = async (req, res) => {
  const { address, paymentMethod = 'Cash on Delivery', couponCode } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

    try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.appliedOffer')
      .populate('items.appliedBankDiscount')
      .session(session);
    
    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'No order items in cart' });
    }

    let itemsPrice = 0;
    let totalCreditCardDiscount = 0;
    const products = [];

    const isOnline = paymentMethod !== 'Cash on Delivery';

    for (const item of cart.items) {
      const product = await Product.findById(item.product).session(session);
      if (!product) {
        throw new Error(`Product not found: ${item.product}`);
      }
      
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      const price = Math.round(product.price - (product.price * product.discount) / 100);
      const itemSubtotal = price * item.quantity;
      itemsPrice += itemSubtotal;

      let itemDiscount = 0;
      let appliedOfferId = null;
      let appliedBankDiscountId = null;
      let assignedSerialNumbers = [];

      // Check legacy offer
      if (item.appliedOffer && isOnline) {
        const offer = item.appliedOffer; 
        if (!offer.isActive || new Date(offer.startDate) > new Date() || new Date(offer.endDate) < new Date()) {
          throw new Error(`Offer ${offer.bankName} is no longer valid`);
        }
        if (itemSubtotal < offer.minTransactionAmount) {
           throw new Error(`Minimum transaction of ${offer.minTransactionAmount} not met for ${offer.bankName} offer`);
        }

        let discountAmount = 0;
        if (offer.discountType === 'percentage') {
          discountAmount = (itemSubtotal * offer.discountValue) / 100;
        } else {
          discountAmount = offer.discountValue;
        }
        
        discountAmount = Math.min(discountAmount, offer.maxDiscountAmount || offer.maxDiscount || Infinity);
        itemDiscount = discountAmount;
        totalCreditCardDiscount += discountAmount;
        appliedOfferId = offer._id;
      }
      // Check new ProductBankDiscount
      else if (item.appliedBankDiscount && isOnline) {
        const bankDiscount = item.appliedBankDiscount;
        if (!bankDiscount.isActive) {
          throw new Error(`Bank discount ${bankDiscount.bankName} is no longer active`);
        }
        if (bankDiscount.minTransactionAmount && itemSubtotal < bankDiscount.minTransactionAmount) {
           throw new Error(`Minimum transaction of ${bankDiscount.minTransactionAmount} not met for this bank discount`);
        }

        let discountAmount = 0;
        if (bankDiscount.discountType === 'percentage') {
          discountAmount = (itemSubtotal * bankDiscount.discountValue) / 100;
        } else {
          discountAmount = bankDiscount.discountValue;
        }
        
        if (bankDiscount.maxDiscountAmount) {
          discountAmount = Math.min(discountAmount, bankDiscount.maxDiscountAmount);
        }

        itemDiscount = discountAmount;
        totalCreditCardDiscount += discountAmount;
        appliedBankDiscountId = bankDiscount._id;
      }

      if (item.selectedSerialNumber) {
        const sn = await ProductSerialNumber.findById(item.selectedSerialNumber).session(session);
        if (!sn) throw new Error('Selected serial number not found');
        if (sn.status === 'Sold' || (sn.status === 'Reserved' && sn.reservedUntil > new Date())) {
          throw new Error(`Serial number for ${product.name} is no longer available. Please refresh your cart.`);
        }
        assignedSerialNumbers.push(sn);
      }

      const neededSNCount = item.quantity - assignedSerialNumbers.length;
      if (neededSNCount > 0) {
        const availableSNs = await ProductSerialNumber.find({ 
          product: product._id, 
          status: 'Available',
          _id: { $nin: assignedSerialNumbers.map(sn => sn._id) }
        }).limit(neededSNCount).session(session);
        
        if (availableSNs.length < neededSNCount) {
          throw new Error(`Not enough serial numbers available for ${product.name}`);
        }
        
        assignedSerialNumbers.push(...availableSNs);
      }

      for (const sn of assignedSerialNumbers) {
        if (isOnline) {
          sn.status = 'Reserved';
          sn.reservedUntil = new Date(Date.now() + 3 * 60 * 1000); // 3 mins
        } else {
          sn.status = 'Reserved'; 
        }
        await sn.save({ session });
      }

      products.push({
        product: product._id,
        name: product.name,
        image: product.images[0] || '',
        price: product.price,
        discount: product.discount,
        quantity: item.quantity,
        serialNumbers: assignedSerialNumbers.map(sn => sn._id),
        appliedCreditCardOffer: appliedOfferId,
        appliedBankDiscount: appliedBankDiscountId,
        creditCardDiscountAmount: itemDiscount,
      });

      product.stock -= item.quantity;
      product.salesCount += item.quantity;
      await product.save({ session });
    }

    let shippingPrice = 99;
    if (address && address.city) {
      const isFreeDelivery = await DeliveryCity.findOne({ 
        cityName: { $regex: new RegExp(`^${address.city}$`, 'i') } 
      }).session(session);
      
      if (isFreeDelivery) {
        shippingPrice = 0;
      }
    }

    let couponDiscount = 0;
    if (couponCode === 'DISCOUNT10') {
      couponDiscount = Math.round(itemsPrice * 0.1);
    }

    const total = Math.max(0, itemsPrice - couponDiscount - totalCreditCardDiscount) + shippingPrice;

    const order = await Order.create([{
      user: req.user._id,
      products,
      itemsPrice,
      shippingPrice,
      couponCode: couponCode === 'DISCOUNT10' ? couponCode : null,
      couponDiscount,
      creditCardDiscountAmount: totalCreditCardDiscount,
      total,
      address,
      paymentMethod,
    }], { session });

    // Link sold/reserved serial numbers to the order
    for (const prod of products) {
      if (prod.serialNumbers && prod.serialNumbers.length > 0) {
        await ProductSerialNumber.updateMany(
          { _id: { $in: prod.serialNumbers } },
          { order: order[0]._id },
          { session }
        );
      }
    }

    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] }, { session });

    await session.commitTransaction();
    session.endSession();

    // Trigger automated Order Confirmation notification
    const populatedOrder = await Order.findById(order[0]._id).populate('user', 'name email phone');
    sendOrderStatusNotification(populatedOrder || order[0], 'Confirmed', req);

    res.status(201).json(order[0]);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(400).json({ message: error.message || 'Error creating order' });
  }
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
    .populate('products.product', 'name images slug brand category')
    .populate('products.serialNumber', 'serialNumber status')
    .populate('products.serialNumbers', 'serialNumber status')
    .populate('products.appliedCreditCardOffer')
    .populate({ path: 'products.appliedBankDiscount', populate: { path: 'bank' } });

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
    
    // Set serial numbers back to available
    if (item.serialNumbers && item.serialNumbers.length > 0) {
      await ProductSerialNumber.updateMany(
        { _id: { $in: item.serialNumbers } },
        { status: 'Available', $unset: { order: 1, reservedUntil: 1 } }
      );
    }
    
    // Support for legacy orders with single serialNumber
    if (item.serialNumber) {
      await ProductSerialNumber.findByIdAndUpdate(
        item.serialNumber,
        { status: 'Available', $unset: { order: 1, reservedUntil: 1 } }
      );
    }
  }

  order.status = 'Cancelled';
  await order.save();

  // Trigger Cancellation notification
  const populatedOrder = await Order.findById(order._id).populate('user', 'name email phone');
  sendOrderStatusNotification(populatedOrder || order, 'Cancelled', req);

  res.json(order);
};

export const getAllOrders = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const orders = await Order.find(filter)
    .populate('user', 'name email phone')
    .populate('products.product', 'name images')
    .populate('products.serialNumber', 'serialNumber status')
    .populate('products.serialNumbers', 'serialNumber status')
    .populate('products.appliedCreditCardOffer')
    .populate({ path: 'products.appliedBankDiscount', populate: { path: 'bank' } })
    .sort({ createdAt: -1 });

  res.json(orders);
};

export const updateOrderStatus = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const previousStatus = order.status;
  const newStatus = req.body.status;
  order.status = newStatus;

  if (newStatus === 'Delivered') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.isPaid = true;
    order.paidAt = Date.now();

    // Mark serial numbers as Sold since the order is delivered
    for (const item of order.products) {
      if (item.serialNumbers && item.serialNumbers.length > 0) {
        await ProductSerialNumber.updateMany(
          { _id: { $in: item.serialNumbers } },
          { $set: { status: 'Sold', reservedUntil: null } }
        );
      }
      if (item.serialNumber) {
        await ProductSerialNumber.findByIdAndUpdate(
          item.serialNumber,
          { $set: { status: 'Sold', reservedUntil: null } }
        );
      }
    }
  }

  // Handle inventory restoration if admin cancels the order
  if (newStatus === 'Cancelled' && previousStatus !== 'Cancelled') {
    for (const item of order.products) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        product.salesCount = Math.max(0, product.salesCount - item.quantity);
        await product.save();
      }
      
      if (item.serialNumbers && item.serialNumbers.length > 0) {
        await ProductSerialNumber.updateMany(
          { _id: { $in: item.serialNumbers } },
          { status: 'Available', $unset: { order: 1, reservedUntil: 1 } }
        );
      }
      
      if (item.serialNumber) {
        await ProductSerialNumber.findByIdAndUpdate(
          item.serialNumber,
          { status: 'Available', $unset: { order: 1, reservedUntil: 1 } }
        );
      }
    }
  }

  await order.save();

  // Trigger Status Update notification (e.g. Confirmed -> Shipped / Delivered / Packed)
  if (previousStatus !== newStatus) {
    const populatedOrder = await Order.findById(order._id).populate('user', 'name email phone');
    sendOrderStatusNotification(populatedOrder || order, newStatus, req);
  }

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
