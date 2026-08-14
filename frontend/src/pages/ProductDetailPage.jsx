import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FaShoppingCart,
  FaHeart,
  FaStar,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaTruck,
  FaShieldAlt,
  FaUndo,
  FaLock,
  FaAward,
  FaStore,
  FaRegStar,
  FaShareAlt,
} from 'react-icons/fa';
import { Loader, StarRating, Alert, Breadcrumb } from '../components/common';
import ProductCard from '../components/ProductCard';
import BankOffers from '../components/BankOffers';
import { productService } from '../services';
import { formatPrice, getDiscountedPrice } from '../utils/helpers';
import { useAuth, useCart } from '../context/AppContext';

const ProductDetailPage = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist, applyOfferToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    setActiveImage(0);
    setCartSuccess(false);
    Promise.all([
      productService.getById(id), 
      productService.getRelated(id)
    ])
      .then(([p, r]) => {
        setProduct(p.data);
        setRelated(r.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;
  if (!product) return null;

  const baseDiscountedPrice = getDiscountedPrice(product.price, product.discount);

  let finalPrice = baseDiscountedPrice;
  if (appliedOffer) {
    if (appliedOffer.discountType === 'amount') {
      finalPrice = Math.max(0, finalPrice - appliedOffer.discountValue);
    } else {
      finalPrice = Math.max(0, finalPrice - (finalPrice * appliedOffer.discountValue) / 100);
    }
  }

  const inWishlist = isInWishlist(product._id);
  const savings = product.price - finalPrice;
  const images = product.images?.length ? product.images : [''];

  const handleAddToCart = async () => {
    if (!user) return navigate('/login');
    setCartLoading(true);
    try {
      const isBankDiscount = appliedOffer && appliedOffer.product;
      const offerId = isBankDiscount ? null : appliedOffer?._id;
      const bankDiscountId = isBankDiscount ? appliedOffer._id : null;

      await addToCart(product._id, quantity, offerId, bankDiscountId);
      setCartSuccess(true);
      setTimeout(() => setCartSuccess(false), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding to cart');
    } finally {
      setCartLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user) return navigate('/login');
    setCartLoading(true);
    try {
      const isBankDiscount = appliedOffer && appliedOffer.product;
      const offerId = isBankDiscount ? null : appliedOffer?._id;
      const bankDiscountId = isBankDiscount ? appliedOffer._id : null;

      await addToCart(product._id, quantity, offerId, bankDiscountId);
      navigate('/cart');
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding to cart');
      setCartLoading(false);
    }
  };

  const handleWishlist = async () => {
    if (!user) return navigate('/login');
    inWishlist ? await removeFromWishlist(product._id) : await addToWishlist(product._id);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} at Raj Electronics!`,
          url: url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(url);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    setReviewLoading(true);
    setReviewError('');
    try {
      await productService.addReview(product._id, review);
      setReviewSuccess('Review submitted successfully!');
      setReview({ rating: 5, comment: '' });
      const { data } = await productService.getById(id);
      setProduct(data);
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  // Extract key overview specs
  const specEntries = product.specifications ? Object.entries(product.specifications) : [];
  const quickSpecs = [
    { label: 'Brand', value: product.brand?.name },
    { label: 'Category', value: product.category?.name },
    ...specEntries
      .filter(([k]) => !['brand', 'category'].includes(k.toLowerCase()))
      .slice(0, 4)
      .map(([k, v]) => ({ label: k, value: v })),
  ].filter((s) => s.value);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <Breadcrumb
        items={[
          { label: 'Home', link: '/' },
          { label: 'Products', link: '/products' },
          { label: product.category?.name || 'Category', link: `/products?category=${product.category?._id}` },
          { label: product.name },
        ]}
      />

      {/* Main Amazon-Style Product Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

          {/* COLUMN 1: Image Gallery (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 mb-4 group">
              <img
                src={
                  product.images?.length
                    ? `${API_URL}${product.images[activeImage]}`
                    : 'https://via.placeholder.com/300x300?text=No+Image'
                }
                alt={product.name}
                className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-300"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImage((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 shadow-md rounded-full p-2.5 hover:bg-primary hover:text-white transition"
                    aria-label="Previous Image"
                  >
                    <FaChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setActiveImage((i) => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 shadow-md rounded-full p-2.5 hover:bg-primary hover:text-white transition"
                    aria-label="Next Image"
                  >
                    <FaChevronRight size={14} />
                  </button>
                </>
              )}
              {product.discount > 0 && (
                <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
                  {product.discount}% OFF
                </span>
              )}
              <button
                onClick={handleShare}
                className="absolute top-4 right-16 p-3 rounded-full shadow-md transition bg-white/90 text-gray-600 hover:text-primary"
                title="Share Product"
              >
                <FaShareAlt size={16} />
              </button>
              <button
                onClick={handleWishlist}
                className={`absolute top-4 right-4 p-3 rounded-full shadow-md transition ${inWishlist ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-400 hover:text-red-500'
                  }`}
                title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <FaHeart size={16} />
              </button>
            </div>

            {/* Thumbnail Carousel */}
            {images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition bg-gray-50 p-1.5 ${i === activeImage ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <img
                      src={
                        img
                          ? `${API_URL}${img}`
                          : 'https://via.placeholder.com/300x300?text=No+Image'
                      }
                      alt={`Thumbnail ${i + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* COLUMN 2: Center Details & Overview Specs (4 cols on lg) */}
          <div className="lg:col-span-4 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-100 lg:pr-6 pb-6 lg:pb-0">
            {/* Brand Store Link */}
            {product.brand?.name && (
              <Link
                to={`/products?brand=${product.brand._id}`}
                className="text-xs font-semibold text-primary hover:underline uppercase tracking-wider mb-1 flex items-center gap-1"
              >
                <FaStore size={12} /> Visit the {product.brand.name} Store
              </Link>
            )}

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight mb-2">
              {product.name}
            </h1>

            {/* Star Rating Bar */}
            <div className="flex items-center gap-2 mb-4">
              <StarRating rating={product.rating} size={14} />
              <span className="text-sm font-semibold text-gray-700">{product.rating.toFixed(1)}</span>
              <span className="text-gray-300">|</span>
              <a href="#reviews" className="text-xs font-medium text-primary hover:underline">
                {product.numReviews || 0} customer ratings
              </a>
            </div>

            <hr className="border-gray-100 mb-4" />

            {/* Pricing Section */}
            <div className="mb-5 bg-gray-50/70 p-4 rounded-xl border border-gray-100">
              <div className="flex items-baseline gap-2 mb-1">
                {product.discount > 0 && (
                  <span className="text-red-600 font-extrabold text-2xl">-{product.discount}%</span>
                )}
                <span className="text-3xl font-extrabold text-gray-900">{formatPrice(finalPrice)}</span>
              </div>
              {product.discount > 0 && (
                <div className="text-xs text-gray-500 space-x-2">
                  <span>M.R.P.: <span className="line-through">{formatPrice(product.price)}</span></span>
                  <span className="text-green-600 font-bold">You Save: {formatPrice(savings)}</span>
                </div>
              )}
              <p className="text-[11px] text-gray-400 mt-1">Inclusive of all taxes. Free doorstep installation on selected electronics.</p>
            </div>

            {/* Bank Offers (if any attached to product) */}
            <BankOffers
              price={baseDiscountedPrice}
              onApplyOffer={(offer) => setAppliedOffer(offer)}
              appliedOffer={appliedOffer}
              offers={[...(product.bankDiscounts || []), ...(product.offers || [])]}
            />

            {/* Product Overview Highlights Table */}
            {quickSpecs.length > 0 && (
              <div className="mb-5">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <FaAward className="text-primary" /> Product Overview
                </h3>
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-100 text-xs">
                  {quickSpecs.map((s, idx) => (
                    <div key={idx} className="flex px-3.5 py-2.5 hover:bg-gray-50/50 transition">
                      <span className="font-semibold text-gray-500 w-28 shrink-0">{s.label}</span>
                      <span className="font-medium text-gray-800 flex-1">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* "About this item" Bullet Points */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-2">
                About this item
              </h3>
              <ul className="space-y-2 text-xs text-gray-600 leading-relaxed">
                {product.features?.length > 0 ? (
                  product.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span>{f}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">•</span> High quality modern electronics designed for durability and performance.</li>
                    <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">•</span> Energy efficient technology with official manufacturer warranty.</li>
                    <li className="flex items-start gap-2"><span className="text-primary font-bold mt-0.5">•</span> Easy doorstep installation and hassle-free return support.</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* COLUMN 3: Amazon Buy Box Action Card (3 cols on lg) */}
          <div className="lg:col-span-3 flex flex-col">
            <div className="bg-gray-50/90 rounded-2xl p-5 border border-gray-200/80 shadow-sm sticky top-24">
              <div className="mb-4">
                <span className="text-2xl font-bold text-gray-900">{formatPrice(finalPrice)}</span>
                <p className="text-xs text-green-700 font-semibold mt-1 flex items-center gap-1">
                  <FaTruck className="text-green-600" /> FREE Delivery Eligible
                </p>
              </div>

              {/* Stock status */}
              <div className="mb-4">
                {product.stock > 0 ? (
                  <span className="text-sm font-bold text-green-600 block">In Stock</span>
                ) : (
                  <span className="text-sm font-bold text-red-600">Currently Unavailable</span>
                )}
              </div>

              {/* Seller / Fulfillment info */}
              <div className="text-xs text-gray-500 space-y-1 mb-4 pb-4 border-b border-gray-200">
                <div className="flex justify-between">
                  <span>Ships from</span>
                  <span className="font-semibold text-gray-700">Raj Electronics</span>
                </div>
                <div className="flex justify-between">
                  <span>Sold by</span>
                  <span className="font-semibold text-gray-700">Raj Electronics Direct</span>
                </div>
              </div>

              {/* Quantity Selector */}
              {product.stock > 0 && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity:</label>
                  <div className="flex items-center border border-gray-300 rounded-xl bg-white overflow-hidden w-full">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-2 hover:bg-gray-100 font-bold text-gray-600 text-sm transition"
                    >
                      −
                    </button>
                    <span className="flex-1 text-center font-semibold text-sm py-2">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      className="px-3 py-2 hover:bg-gray-100 font-bold text-gray-600 text-sm transition"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {cartSuccess && (
                <Alert type="success" message="Added to cart!" onClose={() => setCartSuccess(false)} />
              )}
              {shareSuccess && (
                <Alert type="success" message="Link copied to clipboard!" onClose={() => setShareSuccess(false)} />
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5 mb-5">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0 || cartLoading}
                  className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2 text-sm"
                >
                  <FaShoppingCart size={14} /> {cartLoading ? 'Adding...' : 'Add to Cart'}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0 || cartLoading}
                  className="w-full bg-dark hover:bg-dark-light disabled:opacity-50 text-white font-bold py-3 rounded-xl transition shadow-sm text-sm"
                >
                  Buy Now
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-gray-500 pt-2 border-t border-gray-200">
                <div className="p-1">
                  <FaShieldAlt className="mx-auto text-primary text-base mb-1" />
                  <span>1 Year Warranty</span>
                </div>
                <div className="p-1">
                  <FaUndo className="mx-auto text-primary text-base mb-1" />
                  <span>7 Day Returns</span>
                </div>
                <div className="p-1">
                  <FaLock className="mx-auto text-primary text-base mb-1" />
                  <span>Secure Transaction</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Tabs Section: Product Overview, Technical Specs & Reviews */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50/50 overflow-x-auto">
          {[
            { id: 'overview', label: 'Product Overview' },
            { id: 'specifications', label: 'Technical Details' },
            { id: 'reviews', label: `Customer Reviews (${product.numReviews || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition ${activeTab === tab.id
                  ? 'border-primary text-primary bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* TAB 1: Product Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Detailed Description */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">Product Description</h3>
                <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>

              {/* Highlight Features Grid */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Key Features & Highlights</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: FaTruck, title: 'Free Delivery', desc: 'Doorstep shipping on orders above ₹5,000' },
                    { icon: FaShieldAlt, title: 'Brand Warranty', desc: '100% genuine products with manufacturer warranty' },
                    { icon: FaAward, title: 'Certified Quality', desc: 'Tested for energy rating & maximum efficiency' },
                    { icon: FaUndo, title: '7 Days Return', desc: 'Hassle-free 7-day replacement policy' },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                      <item.icon className="text-primary text-2xl mx-auto mb-2" />
                      <h4 className="font-bold text-sm text-gray-800 mb-1">{item.title}</h4>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Technical Specifications */}
          {activeTab === 'specifications' && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Technical Specifications</h3>
              {specEntries.length > 0 ? (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {specEntries.map(([k, v], idx) => (
                        <tr key={k} className={idx % 2 === 0 ? 'bg-gray-50/60' : 'bg-white'}>
                          <td className="py-3 px-4 font-semibold text-gray-700 w-1/3 border-r border-gray-100">{k}</td>
                          <td className="py-3 px-4 text-gray-600">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No detailed specifications available for this product.</p>
              )}
            </div>
          )}

          {/* TAB 3: Reviews */}
          {activeTab === 'reviews' && (
            <div id="reviews">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Rating Breakdown */}
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 text-center">
                  <h4 className="text-base font-bold text-gray-800 mb-2">Customer Rating</h4>
                  <div className="text-4xl font-extrabold text-gray-900 mb-2">{product.rating.toFixed(1)}</div>
                  <div className="flex justify-center mb-2">
                    <StarRating rating={product.rating} size={18} />
                  </div>
                  <p className="text-xs text-gray-500">Based on {product.numReviews || 0} customer reviews</p>
                </div>

                {/* Reviews List */}
                <div className="lg:col-span-2 space-y-4">
                  {product.reviews?.length > 0 ? (
                    product.reviews.map((r) => (
                      <div key={r._id} className="border border-gray-100 rounded-xl p-4 bg-white shadow-2xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm text-gray-800">{r.name}</span>
                          <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                        <StarRating rating={r.rating} size={12} />
                        <p className="text-gray-600 text-sm mt-2">{r.comment}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No reviews yet for this product. Be the first to review!</p>
                  )}
                </div>
              </div>

              {/* Write Review Form */}
              {user ? (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-bold text-gray-800 mb-4">Write a Product Review</h3>
                  <Alert message={reviewError} type="error" onClose={() => setReviewError('')} />
                  <Alert message={reviewSuccess} type="success" onClose={() => setReviewSuccess('')} />
                  <form onSubmit={handleReviewSubmit} className="space-y-4 max-w-xl">
                    <div>
                      <label className="block text-sm font-medium mb-2">Your Rating</label>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} type="button" onClick={() => setReview((r) => ({ ...r, rating: n }))}>
                            <FaStar size={24} className={n <= review.rating ? 'text-amber-400' : 'text-gray-300'} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Your Review</label>
                      <textarea
                        value={review.comment}
                        onChange={(e) => setReview((r) => ({ ...r, comment: e.target.value }))}
                        required
                        rows={3}
                        placeholder="Share details about durability, performance, or installation experience..."
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={reviewLoading}
                      className="bg-primary hover:bg-primary-dark text-white font-bold px-6 py-2.5 rounded-xl transition text-sm shadow-sm"
                    >
                      {reviewLoading ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                </div>
              ) : (
                <p className="text-gray-500 text-sm border-t border-gray-200 pt-4">
                  <Link to="/login" className="text-primary font-bold hover:underline">
                    Login
                  </Link>{' '}
                  to write a product review.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related Products Section */}
      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
            Customers Who Viewed This Also Bought
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetailPage;
