import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import brandRoutes from './routes/brandRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import userRoutes from './routes/userRoutes.js';
import deliveryCityRoutes from './routes/deliveryCityRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import sliderRoutes from './routes/sliderRoutes.js';
import emiRoutes from './routes/emiRoutes.js';
import productEmiRoutes from './routes/productEmiRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import couponRoutes from './routes/couponRoutes.js';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
  if (req.originalUrl.includes('emi-offers')) {
    console.log(`${req.method} ${req.originalUrl}`);
  }
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Raj Electronics API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/delivery-cities', deliveryCityRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/sliders', sliderRoutes);
app.use('/api/emi', emiRoutes);
app.use('/api/emi-offers', productEmiRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/coupons', couponRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
