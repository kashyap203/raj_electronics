import mongoose from 'mongoose';

const paymentTransactionSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    cartId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart', default: null },
    merchantTxnNo: { type: String, required: true, unique: true },
    gateway: {
      type: String,
      enum: ['ICICI_ORANGE_PG', 'RAZORPAY', 'PINE_LABS'],
      default: 'ICICI_ORANGE_PG',
    },
    gatewayTransactionId: { type: String, default: null },
    iciciTxnId: { type: String, default: null },
    paymentId: { type: String, default: null },
    merchantId: { type: String, default: null },
    aggregatorId: { type: String, default: null },
    paymentMode: { type: String, default: null },
    paymentSubInstrumentType: { type: String, default: null },
    cardNetwork: { type: String, default: null },
    maskedCardNumber: { type: String, default: null },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    emiBankId: { type: String, default: null },
    emiPlanId: { type: String, default: null },
    emiQuoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmiQuote', default: null },
    emiTenure: { type: Number, default: null },
    emiMonthlyAmount: { type: Number, default: null },
    emiInterestRate: { type: Number, default: null },
    emiTotalInterest: { type: Number, default: null },
    emiProcessingFee: { type: Number, default: null },
    emiGst: { type: Number, default: null },
    paymentStatus: {
      type: String,
      enum: ['INITIATED', 'PROCESSING', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'TIMEOUT', 'UNKNOWN'],
      default: 'INITIATED',
    },
    gatewayResponseCode: { type: String, default: null },
    gatewayResponseDescription: { type: String, default: null },
    gatewayPaymentDateTime: { type: Date, default: null },
    gatewayRawResponseRedacted: { type: mongoose.Schema.Types.Mixed, default: {} },
    hashVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
    idempotencyKey: { type: String, default: null },
  },
  { timestamps: true }
);

paymentTransactionSchema.index({ gatewayTransactionId: 1 });
paymentTransactionSchema.index({ orderId: 1, paymentStatus: 1 });

const PaymentTransaction = mongoose.model('PaymentTransaction', paymentTransactionSchema);

export default PaymentTransaction;
