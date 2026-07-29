import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaTruck, FaShieldAlt, FaHeadset, FaUndo, FaStar } from 'react-icons/fa';
import ProductCard from '../components/ProductCard';
import HeroSlider from '../components/HeroSlider';
import { Loader } from '../components/common';
import { productService, categoryService } from '../services';
import { getImageUrl } from '../utils/helpers';

const HomePage = () => {
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [bestSelling, setBestSelling] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featRes, latestRes, bestRes, catRes] = await Promise.all([
          productService.getAll({ featured: true, limit: 8 }),
          productService.getAll({ sort: 'latest', limit: 8 }),
          productService.getAll({ bestSelling: true, limit: 8 }),
          categoryService.getAll(),
        ]);
        setFeatured(featRes.data.products);
        setLatest(latestRes.data.products);
        setBestSelling(bestRes.data.products);
        setCategories(catRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const ProductSection = ({ title, products, link }) => (
    <section className="mb-12 animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <Link to={link} className="text-primary hover:underline font-medium text-sm">
          View All &rarr;
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </section>
  );

  if (loading) return <Loader />;

  return (
    <div>
      {/* Hero Slider with Active Offers and Trending Launches */}
      <HeroSlider />

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Featured Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/products?category=${cat._id}`}
                className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-gray-50">
                  <img
                    src={getImageUrl(cat.image)}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <h3 className="font-semibold text-sm text-gray-800 group-hover:text-primary transition">{cat.name}</h3>
              </Link>
            ))}
          </div>
        </section>

        {/* Special Offers Banner */}
        <section className="mb-12 bg-dark rounded-2xl p-8 md:p-12 text-white shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-primary font-semibold mb-1 uppercase tracking-wide text-sm">Limited Time Offer</p>
              <h2 className="text-3xl sm:text-4xl font-bold mb-2">Up to 40% Off on ACs & TVs</h2>
              <p className="text-gray-300">Free installation on selected models. Hurry, offer ends soon!</p>
            </div>
            <Link to="/products?category=Air Conditioners" className="bg-primary hover:bg-primary-dark text-white font-bold px-8 py-3.5 rounded-full transition-all transform hover:scale-105 shadow-lg shrink-0">
              Grab the Deal
            </Link>
          </div>
        </section>

        {latest.length > 0 && <ProductSection title="Latest Products" products={latest} link="/products?sort=latest" />}
        {bestSelling.length > 0 && <ProductSection title="Best Selling" products={bestSelling} link="/products?bestSelling=true" />}
        {featured.length > 0 && <ProductSection title="Featured Products" products={featured} link="/products?featured=true" />}

        {/* Why Choose Us */}
        <section className="mb-12 bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">Why Choose Raj Electronics?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: FaTruck, title: 'Free Delivery', desc: 'Free shipping on orders above ₹5,000' },
              { icon: FaShieldAlt, title: 'Genuine Products', desc: '100% authentic products with warranty' },
              { icon: FaHeadset, title: '24/7 Support', desc: 'Dedicated customer support team' },
              { icon: FaUndo, title: 'Easy Returns', desc: '7-day hassle-free return policy' },
            ].map((item) => (
              <div key={item.title} className="text-center p-4">
                <item.icon className="text-4xl text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Customer Reviews */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Rahul Sharma', review: 'Excellent service! Got my Samsung TV delivered within 2 days. Installation was smooth and professional.', rating: 5 },
              { name: 'Priya Patel', review: 'Best prices in the market. The Whirlpool fridge I bought is amazing. Highly recommend Raj Electronics!', rating: 5 },
              { name: 'Amit Kumar', review: 'Great experience buying an AC. Staff was helpful in choosing the right model for my room size.', rating: 4 },
            ].map((review) => (
              <div key={review.name} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <FaStar key={i} className="text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm mb-4 italic">"{review.review}"</p>
                <p className="font-semibold text-gray-800">{review.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Newsletter */}
        <section className="bg-dark rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Subscribe to Our Newsletter</h2>
          <p className="text-gray-400 mb-6">Get exclusive deals and updates delivered to your inbox</p>
          <form
            onSubmit={(e) => { e.preventDefault(); alert('Thank you for subscribing!'); setEmail(''); }}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-4 py-3 rounded-full text-gray-800 outline-none"
            />
            <button type="submit" className="bg-primary hover:bg-primary-dark text-dark font-bold px-6 py-3 rounded-full transition">
              Subscribe
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
