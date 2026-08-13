import mongoose from 'mongoose';

const sliderSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    highlight: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    tag: {
      type: String,
      trim: true,
    },
    tagIcon: {
      type: String,
      default: 'FaFire',
    },
    badgeColor: {
      type: String,
      default: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    primaryBtnText: {
      type: String,
      trim: true,
    },
    primaryBtnLink: {
      type: String,
      trim: true,
    },
    secondaryBtnText: {
      type: String,
      trim: true,
    },
    secondaryBtnLink: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Slider = mongoose.model('Slider', sliderSchema);
export default Slider;
