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
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'],
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
