import mongoose from 'mongoose';

const offerEligibilitySchema = new mongoose.Schema(
  {
    offer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer',
      required: true,
    },
    serialNumber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductSerialNumber',
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate mappings
offerEligibilitySchema.index({ offer: 1, serialNumber: 1 }, { unique: true });

const OfferEligibility = mongoose.model('OfferEligibility', offerEligibilitySchema);
export default OfferEligibility;
