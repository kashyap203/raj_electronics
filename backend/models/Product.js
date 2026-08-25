import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    description: { type: String, required: true },
    specifications: { type: Map, of: String, default: {} },
    features: [{ type: String }],
    images: [{ type: String }],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    reviews: [reviewSchema],
    featured: { type: Boolean, default: false },
    bestSelling: { type: Boolean, default: false },
    salesCount: { type: Number, default: 0 },
    offers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Offer' }],
    emiOffers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProductEmiOffer' }],
    emiConfig: {
      enableEmi: { type: Boolean, default: false },
      availableTenures: [{ type: Number }], // e.g. [3, 6, 9, 12]
      baseInterestRate: { type: Number, default: 15 },
      processingFee: { type: Number, default: 0 },
      minEmiAmount: { type: Number, default: 3000 }
    }
  },
  { timestamps: true }
);

productSchema.virtual('discountedPrice').get(function () {
  return Math.round(this.price - (this.price * this.discount) / 100);
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);
export default Product;
