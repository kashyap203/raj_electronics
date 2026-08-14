import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    logo: {
      type: String,
      default: '',
    },
    description: {
      type: String,
    },
    discountType: {
      type: String,
      enum: ['amount', 'percentage'],
      default: 'amount',
    },
    discountValue: {
      type: Number,
    },
    cardType: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
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
  },
  { timestamps: true }
);

const Offer = mongoose.model('Offer', offerSchema);
export default Offer;
