import mongoose from 'mongoose';

const productSerialNumberSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    serialNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Available', 'Reserved', 'Sold'],
      default: 'Available',
    },
    reservedUntil: {
      type: Date,
      default: null,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
  },
  { timestamps: true }
);

// Method to check if reserved
productSerialNumberSchema.methods.isReserved = function () {
  if (this.status !== 'Reserved') return false;
  if (!this.reservedUntil) return false;
  return new Date() < this.reservedUntil;
};

const ProductSerialNumber = mongoose.model('ProductSerialNumber', productSerialNumberSchema);
export default ProductSerialNumber;
