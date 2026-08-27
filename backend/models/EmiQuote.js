import mongoose from 'mongoose';

const emiQuoteSchema = new mongoose.Schema(
  {
    cartId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart', required: true },
    bankId: { type: String, required: true },
    emiPlanId: { type: String, required: true },
    orderAmount: { type: Number, required: true },
    tenureMonths: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    monthlyEmi: { type: Number, required: true },
    totalPrincipal: { type: Number, required: true },
    totalInterest: { type: Number, required: true },
    processingFee: { type: Number, required: true },
    gst: { type: Number, required: true },
    payableNow: { type: Number, required: true }, // May differ if processing fee is charged upfront
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

// TTL index to automatically remove expired quotes
emiQuoteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const EmiQuote = mongoose.model('EmiQuote', emiQuoteSchema);

export default EmiQuote;
