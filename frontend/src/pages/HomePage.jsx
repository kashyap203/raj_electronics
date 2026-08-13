import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaTruck, FaShieldAlt, FaHeadset, FaUndo, FaStar } from 'react-icons/fa';
import ProductCard from '../components/ProductCard';
import HeroSlider from '../components/HeroSlider';
import { Loader } from '../components/common';
import { productService, categoryService, brandService } from '../services';
import { getImageUrl } from '../utils/helpers';

const HomePage = () => {
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [bestSelling, setBestSelling] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');

  const brandLogosMap = {
    'Samsung': 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg',
    'LG': 'https://upload.wikimedia.org/wikipedia/commons/b/bf/LG_logo_%282015%29.svg',
    'Sony': 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg',
    'Whirlpool': 'https://upload.wikimedia.org/wikipedia/commons/6/69/Whirlpool_Corporation_logo.svg',
    'Panasonic': 'https://upload.wikimedia.org/wikipedia/commons/7/71/Panasonic_logo_%28Blue%29.svg',
    'Haier': 'https://upload.wikimedia.org/wikipedia/commons/3/36/Haier_logo.svg',
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featRes, latestRes, bestRes, catRes, brandRes] = await Promise.all([
          productService.getAll({ featured: true, limit: 8 }),
          productService.getAll({ sort: 'latest', limit: 8 }),
          productService.getAll({ bestSelling: true, limit: 8 }),
          categoryService.getAll(),
          brandService.getAll()
        ]);
        setFeatured(featRes?.data?.products || []);
        setLatest(latestRes?.data?.products || []);
        setBestSelling(bestRes?.data?.products || []);
        setCategories(Array.isArray(catRes?.data) ? catRes.data : []);
        setBrands(Array.isArray(brandRes?.data) ? brandRes.data : []);
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
        {(products || []).map((p) => (
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

      {/* Trusted Brands */}
      {brands.length > 0 && (
        <div className="bg-white border-y border-gray-100 py-8">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-center text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">
              Top Electronic Brands
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-70">
              {brands.map(brand => {
                const logoSrc = brand.logo ? getImageUrl(brand.logo) : brandLogosMap[brand.name];
                return (
                  <Link key={brand._id} to={`/products?brand=${brand._id}`} className="hover:opacity-100 transition-opacity duration-300">
                    {logoSrc ? (
                      <img src={logoSrc} alt={brand.name} className="h-6 md:h-8 object-contain grayscale hover:grayscale-0 transition" />
                    ) : (
                      <span className="text-xl md:text-2xl font-black tracking-tight text-gray-800">{brand.name}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
              placeholder="Enter your email address"
              required
              className="flex-1 px-5 py-3 rounded-full bg-white text-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-primary shadow-sm"
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
