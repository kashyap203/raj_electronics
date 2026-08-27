import mongoose from 'mongoose';

const emiPlanSchema = new mongoose.Schema(
  {
    bankId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmiBank', required: true },
    tenureMonths: { type: Number, required: true }, // e.g. 3, 6, 9, 12, 18, 24
    interestRate: { type: Number, required: true }, // annual interest rate percentage
    isNoCostEmi: { type: Boolean, default: false },
    processingFeeType: { type: String, enum: ['amount', 'percentage', 'none'], default: 'none' },
    processingFeeValue: { type: Number, default: 0 },
    gstApplicable: { type: Boolean, default: true },
    minimumOrderValue: { type: Number, default: 3000 },
    maximumOrderValue: { type: Number, default: null },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const EmiPlan = mongoose.model('EmiPlan', emiPlanSchema);

export default EmiPlan;
