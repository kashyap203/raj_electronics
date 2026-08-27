import mongoose from 'mongoose';

const paymentTransactionSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    cartId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart', default: null },
    merchantTxnNo: { type: String, required: true, unique: true },
    iciciTxnId: { type: String, default: null },
    paymentId: { type: String, default: null },
    merchantId: { type: String, default: null },
    aggregatorId: { type: String, default: null },
    paymentMode: { type: String, default: null }, // e.g., CARD, NB, WALLET, UPI
    paymentSubInstrumentType: { type: String, default: null },
    cardNetwork: { type: String, default: null }, // e.g., VISA, MasterCard
    maskedCardNumber: { type: String, default: null },
    amount: { type: Number, required: true },
    currency: { type: String, default: '356' }, // INR
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
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'UNKNOWN'],
      default: 'PENDING'
    },
    gatewayResponseCode: { type: String, default: null },
    gatewayResponseDescription: { type: String, default: null },
    gatewayPaymentDateTime: { type: Date, default: null },
    gatewayRawResponseRedacted: { type: mongoose.Schema.Types.Mixed, default: {} },
    hashVerified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const PaymentTransaction = mongoose.model('PaymentTransaction', paymentTransactionSchema);

export default PaymentTransaction;
