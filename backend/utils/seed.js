import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import slugify from './slugify.js';

dotenv.config();

const categories = [
  { name: 'Televisions', image: 'https://images.unsplash.com/photo-1593359677877-a751728784b1?w=400', description: 'Smart TVs, LED, OLED & more' },
  { name: 'Refrigerators', image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400', description: 'Single & double door fridges' },
  { name: 'Washing Machines', image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400', description: 'Front load & top load washers' },
  { name: 'Air Conditioners', image: 'https://images.unsplash.com/photo-1631545806606-22dadf3e8b0a?w=400', description: 'Split & window AC units' },
  { name: 'Flour Grinder', image: 'https://images.unsplash.com/photo-1585515320312-59c4b5d3a5e5?w=400', description: 'Domestic & commercial grinders' },
];

const brands = [
  { name: 'Samsung', logo: '' },
  { name: 'LG', logo: '' },
  { name: 'Sony', logo: '' },
  { name: 'Whirlpool', logo: '' },
  { name: 'Panasonic', logo: '' },
  { name: 'Voltas', logo: '' },
  { name: 'Haier', logo: '' },
  { name: 'Preethi', logo: '' },
];

const productTemplates = [
  { name: 'Samsung 55" Crystal 4K UHD Smart TV', category: 'Televisions', brand: 'Samsung', price: 52999, discount: 15, stock: 25, featured: true, bestSelling: true, rating: 4.5, image: 'https://images.unsplash.com/photo-1593359677877-a751728784b1?w=600' },
  { name: 'LG 43" Full HD Smart LED TV', category: 'Televisions', brand: 'LG', price: 28999, discount: 10, stock: 30, featured: true, rating: 4.3, image: 'https://images.unsplash.com/photo-1461155695902-757b4867b276?w=600' },
  { name: 'Sony Bravia 65" 4K OLED TV', category: 'Televisions', brand: 'Sony', price: 149999, discount: 20, stock: 10, featured: true, bestSelling: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600' },
  { name: 'Whirlpool 340L Double Door Refrigerator', category: 'Refrigerators', brand: 'Whirlpool', price: 35999, discount: 12, stock: 20, featured: true, bestSelling: true, rating: 4.4, image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600' },
  { name: 'Samsung 253L Single Door Refrigerator', category: 'Refrigerators', brand: 'Samsung', price: 18999, discount: 8, stock: 35, rating: 4.2, image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600' },
  { name: 'LG 260L Frost Free Double Door', category: 'Refrigerators', brand: 'LG', price: 27999, discount: 10, stock: 18, featured: true, rating: 4.5, image: 'https://images.unsplash.com/photo-1622495613795-3ab9c7f3a7d0?w=600' },
  { name: 'LG 7kg Front Load Washing Machine', category: 'Washing Machines', brand: 'LG', price: 32999, discount: 15, stock: 15, featured: true, bestSelling: true, rating: 4.6, image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600' },
  { name: 'Samsung 6.5kg Top Load Washer', category: 'Washing Machines', brand: 'Samsung', price: 19999, discount: 10, stock: 22, rating: 4.3, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600' },
  { name: 'Whirlpool 8kg Semi Automatic', category: 'Washing Machines', brand: 'Whirlpool', price: 12999, discount: 5, stock: 40, bestSelling: true, rating: 4.1, image: 'https://images.unsplash.com/photo-1604335399105-a0c585fd81a4?w=600' },
  { name: 'Voltas 1.5 Ton 3 Star Split AC', category: 'Air Conditioners', brand: 'Voltas', price: 32999, discount: 18, stock: 20, featured: true, bestSelling: true, rating: 4.4, image: 'https://images.unsplash.com/photo-1631545806606-22dadf3e8b0a?w=600' },
  { name: 'LG 1 Ton 5 Star Inverter AC', category: 'Air Conditioners', brand: 'LG', price: 38999, discount: 12, stock: 12, featured: true, rating: 4.7, image: 'https://images.unsplash.com/photo-1585771724684-38269bc663c1?w=600' },
  { name: 'Panasonic 2 Ton Window AC', category: 'Air Conditioners', brand: 'Panasonic', price: 28999, discount: 10, stock: 8, rating: 4.0, image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600' },
  { name: 'Preethi Blue Leaf Platinum Mixer Grinder', category: 'Flour Grinder', brand: 'Preethi', price: 6499, discount: 20, stock: 50, featured: true, bestSelling: true, rating: 4.6, image: 'https://images.unsplash.com/photo-1585515320312-59c4b5d3a5e5?w=600' },
  { name: 'Preethi Zodiac MG 218 Mixer Grinder', category: 'Flour Grinder', brand: 'Preethi', price: 8999, discount: 15, stock: 30, featured: true, rating: 4.5, image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600' },
  { name: 'Haier 750W Atta Kneader & Grinder', category: 'Flour Grinder', brand: 'Haier', price: 4999, discount: 10, stock: 45, rating: 4.2, image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600' },
];

const seed = async () => {
  try {
    await connectDB();

    await User.deleteMany();
    await Category.deleteMany();
    await Brand.deleteMany();
    await Product.deleteMany();

    await User.create({
      name: 'Admin',
      email: 'admin@rajelectronics.com',
      password: 'admin123',
      phone: '9876543210',
      role: 'admin',
    });

    await User.create({
      name: 'Demo Customer',
      email: 'customer@demo.com',
      password: 'demo123',
      phone: '9123456789',
      role: 'customer',
    });

    const createdCategories = await Category.insertMany(categories);
    const createdBrands = await Brand.insertMany(brands);

    const categoryMap = Object.fromEntries(createdCategories.map((c) => [c.name, c._id]));
    const brandMap = Object.fromEntries(createdBrands.map((b) => [b.name, b._id]));

    const products = productTemplates.map((p) => ({
      name: p.name,
      slug: slugify(p.name),
      brand: brandMap[p.brand],
      category: categoryMap[p.category],
      price: p.price,
      discount: p.discount,
      stock: p.stock,
      description: `Premium ${p.name} from ${p.brand}. Built with cutting-edge technology for superior performance and energy efficiency. Perfect for modern homes.`,
      specifications: {
        Brand: p.brand,
        Category: p.category,
        Warranty: '1 Year Manufacturer Warranty',
        'Energy Rating': '5 Star',
      },
      features: [
        'Energy efficient design',
        'Premium build quality',
        'Easy installation support',
        '1 year warranty included',
      ],
      images: [p.image],
      rating: p.rating || 4.0,
      numReviews: Math.floor(Math.random() * 50) + 10,
      featured: p.featured || false,
      bestSelling: p.bestSelling || false,
      salesCount: p.bestSelling ? Math.floor(Math.random() * 200) + 50 : Math.floor(Math.random() * 30),
    }));

    await Product.insertMany(products);

    console.log('Database seeded successfully!');
    console.log('Admin: admin@rajelectronics.com / admin123');
    console.log('Customer: customer@demo.com / demo123');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
