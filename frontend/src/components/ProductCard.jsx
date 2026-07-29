import { Link, useNavigate } from 'react-router-dom';
import { FaHeart, FaShoppingCart, FaEye } from 'react-icons/fa';
import { StarRating } from './common';
import { formatPrice, getDiscountedPrice, getImageUrl } from '../utils/helpers';
import { useAuth, useCart } from '../context/AppContext';
import { useState } from 'react';

const ProductCard = ({ product }) => {
  const { user } = useAuth();
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const discountedPrice = getDiscountedPrice(product.price, product.discount);
  const inWishlist = isInWishlist(product._id);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate('/login');
    setLoading(true);
    try {
      await addToCart(product._id);
    } finally {
      setLoading(false);
    }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate('/login');
    if (inWishlist) {
      await removeFromWishlist(product._id);
    } else {
      await addToWishlist(product._id);
    }
  };

  return (
    <Link
      to={`/products/${product._id}`}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group animate-fade-in flex flex-col"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={getImageUrl(product.images?.[0])}
          alt={product.name}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
        />
        {product.discount > 0 && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{product.discount}%
          </span>
        )}
        <button
          onClick={handleWishlist}
          className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition ${
            inWishlist ? 'bg-red-500 text-white' : 'bg-white text-gray-400 hover:text-red-500'
          }`}
        >
          <FaHeart size={14} />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-gray-500 mb-1">{product.brand?.name}</p>
        <h3 className="font-medium text-sm text-gray-800 line-clamp-2 mb-2 flex-1 group-hover:text-primary transition">
          {product.name}
        </h3>

        <div className="flex items-center gap-2 mb-2">
          <StarRating rating={product.rating} size={12} />
          <span className="text-xs text-gray-500">({product.numReviews || 0})</span>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-lg font-bold text-gray-900">{formatPrice(discountedPrice)}</span>
          {product.discount > 0 && (
            <span className="text-sm text-gray-400 line-through">{formatPrice(product.price)}</span>
          )}
        </div>

        <p className={`text-xs font-medium mb-3 ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
          {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
        </p>

        <div className="flex gap-2 mt-auto">
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || loading}
            className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-dark font-semibold text-sm py-2 rounded-full transition flex items-center justify-center gap-1"
          >
            <FaShoppingCart size={12} />
            {loading ? 'Adding...' : 'Add to Cart'}
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/products/${product._id}`); }}
            className="p-2 border border-gray-300 rounded-full hover:border-primary hover:text-primary transition"
          >
            <FaEye size={14} />
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
