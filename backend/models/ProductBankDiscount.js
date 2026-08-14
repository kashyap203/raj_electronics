import mongoose from 'mongoose';

const productBankDiscountSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    bank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer',
      required: true,
    },
    cardType: {
      type: String,
    },
    description: {
      type: String,
    },
    discountType: {
      type: String,
      required: true,
      enum: ['amount', 'percentage'],
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
    },
    minTransactionAmount: {
      type: Number,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const ProductBankDiscount = mongoose.model('ProductBankDiscount', productBankDiscountSchema);
export default ProductBankDiscount;
