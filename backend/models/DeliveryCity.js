import mongoose from 'mongoose';

const deliveryCitySchema = new mongoose.Schema(
  {
    cityName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const DeliveryCity = mongoose.model('DeliveryCity', deliveryCitySchema);

export default DeliveryCity;
