import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Slider from '../models/Slider.js';
import connectDB from '../config/db.js';

dotenv.config();

connectDB();

const slides = [
  {
    tag: 'Active Offer',
    tagIcon: 'FaFire',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    title: 'Mega Festival Sale',
    highlight: 'Up to 40% OFF',
    description: 'Upgrade your home with latest Smart TVs, Refrigerators, ACs, and Washing Machines at unbeatable prices. Limited period deals!',
    primaryBtnText: 'Shop Active Offers',
    primaryBtnLink: '/products',
    secondaryBtnText: 'Browse Categories',
    secondaryBtnLink: '/categories',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1000&auto=format&fit=crop&q=80',
    isActive: true,
    order: 1,
  },
  {
    tag: 'Trending Launch',
    tagIcon: 'FaRocket',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    title: 'Next-Gen 4K OLED TVs',
    highlight: 'Cinematic Experience',
    description: 'Immerse yourself in ultra-vivid colors, deep contrast, and AI sound enhancement with top branded OLED & QLED displays.',
    primaryBtnText: 'Explore Smart TVs',
    primaryBtnLink: '/products?category=Televisions',
    secondaryBtnText: 'View Trending',
    secondaryBtnLink: '/products?sort=latest',
    image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=1000&auto=format&fit=crop&q=80',
    isActive: true,
    order: 2,
  },
  {
    tag: 'Hot Deal',
    tagIcon: 'FaBolt',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    title: '5-Star Smart Air Conditioners',
    highlight: 'Instant Cooling Savings',
    description: 'Beat the heat with heavy-duty inverter ACs featuring fast cooling, dust filters, and zero maintenance warranty.',
    primaryBtnText: 'Grab AC Deals',
    primaryBtnLink: '/products?category=Air%20Conditioners',
    secondaryBtnText: 'Best Sellers',
    secondaryBtnLink: '/products?bestSelling=true',
    image: 'https://images.unsplash.com/photo-1631545806606-22dadf3e8b0a?w=1000&auto=format&fit=crop&q=80',
    isActive: true,
    order: 3,
  },
  {
    tag: 'Trending Launch',
    tagIcon: 'FaCrown',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    title: 'Smart Home Refrigerators',
    highlight: 'Advanced Twin Cooling',
    description: 'Convertible multi-door double refrigerators with digital inverter tech and door cooling to keep food fresh twice as long.',
    primaryBtnText: 'Discover Refrigerators',
    primaryBtnLink: '/products?category=Refrigerators',
    secondaryBtnText: 'View All Deals',
    secondaryBtnLink: '/products',
    image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=1000&auto=format&fit=crop&q=80',
    isActive: true,
    order: 4,
  },
];

const seedSliders = async () => {
  try {
    const existing = await Slider.countDocuments();
    if (existing > 0) {
      console.log('Sliders already exist in DB. Skipping seed.');
      process.exit();
    }
    await Slider.insertMany(slides);
    console.log('Sliders Seeded Successfully');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedSliders();
