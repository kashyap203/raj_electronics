import mongoose from 'mongoose';

const productEmiOfferSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    bankName: { type: String, required: true },
    logo: { type: String, default: '' },
    cardType: { type: String, enum: ['CREDIT', 'DEBIT', 'BOTH'], default: 'CREDIT' },
    emiType: { type: String, enum: ['REGULAR', 'NO_COST'], default: 'REGULAR' },
    tenure: { type: Number, required: true }, // e.g., 3, 6, 9, 12
    interestRate: { type: Number, required: true },
    processingFee: { type: Number, default: 0 },
    discountType: { type: String, enum: ['amount', 'percentage', 'none'], default: 'none' },
    discountValue: { type: Number, default: 0 },
    maxDiscount: { type: Number },
    minOrderAmount: { type: Number, default: 3000 },
    maxOrderAmount: { type: Number },
    startDate: { type: Date },
    endDate: { type: Date },
    priority: { type: Number, default: 10 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ProductEmiOffer = mongoose.model('ProductEmiOffer', productEmiOfferSchema);
export default ProductEmiOffer;
