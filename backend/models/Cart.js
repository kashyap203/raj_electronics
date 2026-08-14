import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  selectedSerialNumber: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductSerialNumber', default: null },
  appliedOffer: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', default: null },
  appliedBankDiscount: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductBankDiscount', default: null },
});

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
