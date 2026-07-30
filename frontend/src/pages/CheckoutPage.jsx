import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaMoneyBillWave, FaCreditCard } from 'react-icons/fa';
import { useCart, useAuth } from '../context/AppContext';
import { orderService, deliveryCityService } from '../services';
import { formatPrice, getDiscountedPrice, getImageUrl } from '../utils/helpers';
import { Alert } from '../components/common';

const CheckoutPage = () => {
  const { cart, fetchCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    street: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);

  const items = cart.items || [];
  const subtotal = items.reduce((acc, item) => {
    const price = getDiscountedPrice(item.product?.price || 0, item.product?.discount || 0);
    return acc + price * item.quantity;
  }, 0);
  const [deliveryCities, setDeliveryCities] = useState([]);
  
  useEffect(() => {
    deliveryCityService.getAll().then(res => setDeliveryCities(res.data)).catch(console.error);
  }, []);

  const isFreeDelivery = address.city && deliveryCities.some(
    c => c.cityName.toLowerCase() === address.city.trim().toLowerCase()
  );
  const shipping = address.city ? (isFreeDelivery ? 0 : 99) : 99;
  const total = subtotal - couponDiscount + shipping;

  const applyCoupon = () => {
    if (couponCode.trim().toUpperCase() === 'DISCOUNT10') {
      setAppliedCoupon('DISCOUNT10');
      setCouponDiscount(Math.round(subtotal * 0.1));
    } else {
      alert('Invalid Coupon Code');
      setAppliedCoupon('');
      setCouponDiscount(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return setError('Your cart is empty');
    setLoading(true);
    setError('');
    try {
      const orderItems = items.map(item => ({ product: item.product._id, quantity: item.quantity }));
      const { data } = await orderService.create({ orderItems, address, paymentMethod, couponCode: appliedCoupon || undefined });
      await fetchCart();
      navigate(`/profile/orders/${data._id}`, { state: { success: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = (e) => setAddress({ ...address, [e.target.name]: e.target.value });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>
      <Alert message={error} type="error" onClose={() => setError('')} />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Address + Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaMapMarkerAlt className="text-primary" /> Delivery Address
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'fullName', label: 'Full Name', placeholder: 'Rahul Sharma', full: false },
                  { name: 'phone', label: 'Phone Number', placeholder: '+91 98765 43210', full: false },
                  { name: 'street', label: 'Street Address', placeholder: '123, MG Road', full: true },
                  { name: 'city', label: 'City', placeholder: 'Bangalore', full: false },
                  { name: 'state', label: 'State', placeholder: 'Karnataka', full: false },
                  { name: 'pincode', label: 'Pincode', placeholder: '560001', full: false },
                ].map(field => (
                  <div key={field.name} className={field.full ? 'sm:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    <input
                      type="text"
                      name={field.name}
                      value={address[field.name]}
                      onChange={handleAddressChange}
                      required
                      placeholder={field.placeholder}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="font-bold text-gray-800 mb-4">Payment Method</h2>
              <div className="space-y-3">
                {[
                  { value: 'Cash on Delivery', label: 'Cash on Delivery', icon: FaMoneyBillWave, desc: 'Pay when your order arrives' },
                  { value: 'UPI', label: 'UPI Payment', icon: FaCreditCard, desc: 'Pay via UPI apps' },
                  { value: 'Card', label: 'Credit / Debit Card', icon: FaCreditCard, desc: 'Visa, Mastercard, RuPay' },
                ].map(opt => (
                  <label key={opt.value} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${paymentMethod === opt.value ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="payment" value={opt.value} checked={paymentMethod === opt.value} onChange={e => setPaymentMethod(e.target.value)} className="accent-primary" />
                    <opt.icon className={paymentMethod === opt.value ? 'text-primary' : 'text-gray-400'} size={20} />
                    <div>
                      <p className="font-medium text-sm text-gray-800">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-2">Have a Coupon?</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCouponCode(val);
                      if (appliedCoupon && val.trim().toUpperCase() !== appliedCoupon) {
                        setAppliedCoupon('');
                        setCouponDiscount(0);
                      }
                    }}
                    placeholder="Enter coupon code"
                    className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none uppercase"
                  />
                  <button type="button" onClick={applyCoupon} className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
                    Apply
                  </button>
                </div>
                {appliedCoupon && (
                  <p className="text-green-600 text-xs mt-2 font-medium">
                    Coupon '{appliedCoupon}' applied successfully!
                  </p>
                )}
              </div>
              <h2 className="font-bold text-gray-800 mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {items.map(item => {
                  if (!item.product) return null;
                  const price = getDiscountedPrice(item.product.price, item.product.discount);
                  return (
                    <div key={item._id} className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                        <img src={getImageUrl(item.product.images?.[0])} alt={item.product.name} className="w-full h-full object-contain p-1" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 line-clamp-1">{item.product.name}</p>
                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold shrink-0">{formatPrice(price * item.quantity)}</p>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-gray-200 pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Discount ({appliedCoupon})</span>
                    <span>-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600' : ''}>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-800 text-base border-t border-gray-200 pt-2">
                  <span>Total</span><span>{formatPrice(total)}</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 text-dark font-bold py-3 rounded-xl transition mt-4"
              >
                {loading ? 'Placing Order...' : `Place Order – ${formatPrice(total)}`}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
