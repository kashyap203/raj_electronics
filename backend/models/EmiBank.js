import mongoose from 'mongoose';

const emiBankSchema = mongoose.Schema({
  bankName: {
    type: String,
    required: true,
    unique: true
  },
  bankCode: {
    type: String,
    required: true,
    unique: true
  },
  logo: {
    type: String,
    default: ''
  },
  active: {
    type: Boolean,
    default: true
  },
}, {
  timestamps: true
});

const EmiBank = mongoose.model('EmiBank', emiBankSchema);

export default EmiBank;
