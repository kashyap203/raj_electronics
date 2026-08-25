import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import EmiBank from './models/EmiBank.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const seedBanks = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected.');

    const banks = [
      { bankName: 'ICICI Bank', bankCode: 'ICICI', logo: '/images/banks/icici.png' },
      { bankName: 'HDFC Bank', bankCode: 'HDFC', logo: '/images/banks/hdfc.png' },
      { bankName: 'State Bank of India', bankCode: 'SBI', logo: '/images/banks/sbi.png' },
      { bankName: 'Axis Bank', bankCode: 'AXIS', logo: '/images/banks/axis.png' },
      { bankName: 'Bajaj Finserv', bankCode: 'BAJAJ', logo: '/images/banks/bajaj.png' },
    ];

    await EmiBank.deleteMany({});
    console.log('Cleared existing banks.');

    await EmiBank.insertMany(banks);
    console.log('Successfully seeded EMI Banks.');

    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedBanks();
