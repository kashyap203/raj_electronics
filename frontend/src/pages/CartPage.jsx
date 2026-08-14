import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaShoppingBag, FaMinus, FaPlus } from 'react-icons/fa';
import { useCart } from '../context/AppContext';
import { EmptyState } from '../components/common';
import { formatPrice, getDiscountedPrice, getImageUrl } from '../utils/helpers';

const CartPage = () => {
  const { cart, updateCartItem, removeFromCart } = useCart();
  const navigate = useNavigate();

  const items = cart.items || [];

  const subtotal = items.reduce((acc, item) => {
    const price = getDiscountedPrice(item.product?.price || 0, item.product?.discount || 0);
    return acc + price * item.quantity;
  }, 0);

  let totalOfferDiscount = 0;
  items.forEach(item => {
    if (!item.product) return;
    const price = getDiscountedPrice(item.product.price, item.product.discount);
    const itemSubtotal = price * item.quantity;
    
    if (item.appliedOffer) {
       const offer = item.appliedOffer;
       if (itemSubtotal >= (offer.minTransactionAmount || 0)) {
         let discount = 0;
         if (offer.discountType === 'amount') {
           discount = offer.discountValue;
         } else {
           discount = (itemSubtotal * offer.discountValue) / 100;
         }
         discount = Math.min(discount, offer.maxDiscountAmount || Infinity);
         totalOfferDiscount += discount;
       }
    }
  });

  const finalTotal = Math.max(0, subtotal - totalOfferDiscount);
  const shippingText = "Calculated at checkout";
  const totalText = "Calculated at checkout";

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          icon={FaShoppingBag}
          title="Your cart is empty"
          description="Looks like you haven't added anything yet"
          action={
            <Link to="/products" className="bg-primary text-white font-bold px-8 py-3 rounded-full hover:bg-primary-dark transition inline-block">
              Start Shopping
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Shopping Cart ({items.length} {items.length === 1 ? 'item' : 'items'})</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => {
            if (!item.product) return null;
            const p = item.product;
            const price = getDiscountedPrice(p.price, p.discount);
            return (
              <div key={item._id} className="bg-white rounded-2xl shadow-sm p-4 flex gap-4 animate-fade-in">
                <Link to={`/products/${p._id}`} className="shrink-0 w-24 h-24 bg-gray-50 rounded-xl overflow-hidden">
                  <img src={getImageUrl(p.images?.[0])} alt={p.name} className="w-full h-full object-contain p-2" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${p._id}`} className="font-medium text-gray-800 hover:text-primary line-clamp-2 text-sm">
                    {p.name}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">{p.brand?.name}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => item.quantity > 1 ? updateCartItem(p._id, item.quantity - 1) : removeFromCart(p._id)}
                        className="px-3 py-1.5 hover:bg-gray-100 text-sm font-bold"
                      >
                        <FaMinus size={10} />
                      </button>
                      <span className="px-3 py-1.5 text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateCartItem(p._id, item.quantity + 1)}
                        disabled={item.quantity >= p.stock}
                        className="px-3 py-1.5 hover:bg-gray-100 text-sm font-bold disabled:opacity-40"
                      >
                        <FaPlus size={10} />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatPrice(price * item.quantity)}</p>
                      {p.discount > 0 && <p className="text-xs text-gray-400 line-through">{formatPrice(p.price * item.quantity)}</p>}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(p._id)}
                  className="text-gray-300 hover:text-red-500 transition shrink-0 self-start mt-1"
                >
                  <FaTrash size={14} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
            <h2 className="font-bold text-gray-800 mb-4 text-lg">Order Summary</h2>
            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-xs text-gray-500 mt-1">{shippingText}</span>
              </div>
              {totalOfferDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Bank Offers Applied</span>
                  <span>- {formatPrice(totalOfferDiscount)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-base text-gray-800">
                <span>Total</span>
                <span>{formatPrice(finalTotal)}</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition"
            >
              Proceed to Checkout
            </button>
            <Link to="/products" className="block text-center text-sm text-gray-500 hover:text-primary mt-3 transition">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
