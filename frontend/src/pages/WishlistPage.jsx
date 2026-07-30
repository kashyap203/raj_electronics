import { Link } from 'react-router-dom';
import { FaHeart, FaTrash } from 'react-icons/fa';
import { useCart } from '../context/AppContext';
import { EmptyState } from '../components/common';
import { getImageUrl, formatPrice, getDiscountedPrice } from '../utils/helpers';

const WishlistPage = () => {
  const { wishlist, removeFromWishlist, addToCart } = useCart();
  const products = wishlist.products || [];

  if (products.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          icon={FaHeart}
          title="Your wishlist is empty"
          description="Save products you love and come back later"
          action={
            <Link to="/products" className="bg-primary text-white font-bold px-8 py-3 rounded-full hover:bg-primary-dark transition inline-block">
              Explore Products
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Wishlist ({products.length} items)</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map(p => {
          const price = getDiscountedPrice(p.price, p.discount);
          return (
            <div key={p._id} className="bg-white rounded-2xl shadow-sm overflow-hidden group animate-fade-in">
              <Link to={`/products/${p._id}`} className="block relative aspect-square bg-gray-50">
                <img src={getImageUrl(p.images?.[0])} alt={p.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300" />
                {p.discount > 0 && (
                  <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">-{p.discount}%</span>
                )}
              </Link>
              <div className="p-4">
                <p className="text-xs text-gray-500 mb-1">{p.brand?.name}</p>
                <Link to={`/products/${p._id}`} className="font-medium text-sm text-gray-800 hover:text-primary line-clamp-2 mb-3 block">
                  {p.name}
                </Link>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="font-bold text-gray-900">{formatPrice(price)}</span>
                  {p.discount > 0 && <span className="text-xs text-gray-400 line-through">{formatPrice(p.price)}</span>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => addToCart(p._id)}
                    disabled={p.stock === 0}
                    className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-semibold text-sm py-2 rounded-xl transition"
                  >
                    {p.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={() => removeFromWishlist(p._id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WishlistPage;
