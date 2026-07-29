import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaShoppingCart, FaHeart, FaStar, FaCheck, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Loader, StarRating, Alert, Breadcrumb } from '../components/common';
import ProductCard from '../components/ProductCard';
import { productService } from '../services';
import { formatPrice, getDiscountedPrice, getImageUrl } from '../utils/helpers';
import { useAuth, useCart } from '../context/AppContext';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useCart();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setActiveImage(0);
    setCartSuccess(false);
    Promise.all([productService.getById(id), productService.getRelated(id)])
      .then(([p, r]) => { setProduct(p.data); setRelated(r.data); })
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <Loader />;
  if (!product) return null;

  const discountedPrice = getDiscountedPrice(product.price, product.discount);
  const inWishlist = isInWishlist(product._id);

  const handleAddToCart = async () => {
    if (!user) return navigate('/login');
    setCartLoading(true);
    try {
      await addToCart(product._id, quantity);
      setCartSuccess(true);
      setTimeout(() => setCartSuccess(false), 3000);
    } finally {
      setCartLoading(false);
    }
  };

  const handleWishlist = async () => {
    if (!user) return navigate('/login');
    inWishlist ? await removeFromWishlist(product._id) : await addToWishlist(product._id);
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

  const images = product.images?.length ? product.images : [''];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumb items={[
        { label: 'Home', link: '/' },
        { label: 'Products', link: '/products' },
        { label: product.name },
      ]} />

      {/* Product Main */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-3 relative">
              <img
                src={getImageUrl(images[activeImage])}
                alt={product.name}
                className="w-full h-full object-contain p-6"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImage(i => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white shadow-md rounded-full p-2 hover:bg-gray-100"
                  ><FaChevronLeft size={14} /></button>
                  <button
                    onClick={() => setActiveImage(i => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white shadow-md rounded-full p-2 hover:bg-gray-100"
                  ><FaChevronRight size={14} /></button>
                </>
              )}
              {product.discount > 0 && (
                <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  -{product.discount}%
                </span>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${i === activeImage ? 'border-primary' : 'border-gray-200'}`}
                  >
                    <img src={getImageUrl(img)} alt={`View ${i + 1}`} className="w-full h-full object-contain p-1 bg-gray-50" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <p className="text-sm text-gray-500 mb-1">{product.brand?.name} · {product.category?.name}</p>
            <h1 className="text-2xl font-bold text-gray-800 mb-3">{product.name}</h1>

            <div className="flex items-center gap-3 mb-4">
              <StarRating rating={product.rating} />
              <span className="text-sm text-gray-500">({product.numReviews} reviews)</span>
            </div>

            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-3xl font-bold text-gray-900">{formatPrice(discountedPrice)}</span>
              {product.discount > 0 && (
                <>
                  <span className="text-lg text-gray-400 line-through">{formatPrice(product.price)}</span>
                  <span className="text-green-600 font-semibold text-sm">Save {formatPrice(product.price - discountedPrice)}</span>
                </>
              )}
            </div>

            <p className={`text-sm font-medium mb-5 ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {product.stock > 0 ? `✓ In Stock (${product.stock} available)` : '✗ Out of Stock'}
            </p>

            {/* Features */}
            {product.features?.length > 0 && (
              <ul className="space-y-1 mb-5">
                {product.features.slice(0, 4).map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <FaCheck size={10} className="text-green-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            )}

            {/* Quantity + Cart */}
            {product.stock > 0 && (
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-4 py-2.5 hover:bg-gray-100 font-bold text-lg">−</button>
                  <span className="px-4 py-2.5 font-semibold min-w-[2rem] text-center">{quantity}</span>
                  <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} className="px-4 py-2.5 hover:bg-gray-100 font-bold text-lg">+</button>
                </div>
                <p className="text-xs text-gray-400">Max: {product.stock}</p>
              </div>
            )}

            {cartSuccess && <Alert type="success" message="Added to cart successfully!" onClose={() => setCartSuccess(false)} />}

            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0 || cartLoading}
                className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                <FaShoppingCart /> {cartLoading ? 'Adding...' : 'Add to Cart'}
              </button>
              <button
                onClick={handleWishlist}
                className={`p-3 rounded-xl border-2 transition ${inWishlist ? 'bg-red-500 border-red-500 text-white' : 'border-gray-300 hover:border-red-400 hover:text-red-500'}`}
              >
                <FaHeart />
              </button>
            </div>

            <button
              onClick={() => { handleAddToCart().then(() => navigate('/cart')); }}
              disabled={product.stock === 0}
              className="mt-3 w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm mb-8 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {['description', 'specifications', 'reviews'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-semibold capitalize whitespace-nowrap border-b-2 transition ${
                activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab} {tab === 'reviews' && `(${product.numReviews})`}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'description' && (
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>
          )}

          {activeTab === 'specifications' && (
            <div className="overflow-x-auto">
              {product.specifications && Object.keys(product.specifications).length > 0 ? (
                <table className="w-full text-sm">
                  <tbody>
                    {Object.entries(product.specifications).map(([k, v]) => (
                      <tr key={k} className="border-b border-gray-100">
                        <td className="py-3 pr-4 font-medium text-gray-700 w-1/3">{k}</td>
                        <td className="py-3 text-gray-600">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500">No specifications available.</p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              {/* Review list */}
              {product.reviews?.length > 0 ? (
                <div className="space-y-4 mb-8">
                  {product.reviews.map(r => (
                    <div key={r._id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{r.name}</span>
                        <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                      <StarRating rating={r.rating} size={12} />
                      <p className="text-gray-600 text-sm mt-2">{r.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 mb-8">No reviews yet. Be the first!</p>
              )}

              {/* Write review */}
              {user && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-bold text-gray-800 mb-4">Write a Review</h3>
                  <Alert message={reviewError} type="error" onClose={() => setReviewError('')} />
                  <Alert message={reviewSuccess} type="success" onClose={() => setReviewSuccess('')} />
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button key={n} type="button" onClick={() => setReview(r => ({ ...r, rating: n }))}>
                            <FaStar size={24} className={n <= review.rating ? 'text-amber-400' : 'text-gray-300'} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Comment</label>
                      <textarea
                        value={review.comment}
                        onChange={e => setReview(r => ({ ...r, comment: e.target.value }))}
                        required
                        rows={3}
                        placeholder="Share your experience..."
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
                      />
                    </div>
                    <button type="submit" disabled={reviewLoading} className="bg-primary hover:bg-primary-dark text-white font-bold px-6 py-2.5 rounded-xl transition">
                      {reviewLoading ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                </div>
              )}
              {!user && (
                <p className="text-gray-500 text-sm border-t border-gray-200 pt-4">
                  <Link to="/login" className="text-primary font-semibold">Login</Link> to write a review.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetailPage;
