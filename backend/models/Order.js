import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  image: { type: String, default: '' },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  quantity: { type: Number, required: true, min: 1 },
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    products: [orderItemSchema],
    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, default: 0 },
    total: { type: Number, required: true },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      phone: { type: String, required: true },
    },
    paymentMethod: { type: String, default: 'Cash on Delivery' },
    paymentDetails: {
      razorpayOrderId: { type: String, default: null },
      razorpayPaymentId: { type: String, default: null },
      razorpaySignature: { type: String, default: null },
      paymentStatus: { type: String, enum: ['Pending', 'Success', 'Failed', 'Cancelled'], default: 'Pending' },
      failureReason: { type: String, default: null },
    },
    couponCode: { type: String, default: null },
    couponDiscount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    isDelivered: { type: Boolean, default: false },
    deliveredAt: Date,
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;
