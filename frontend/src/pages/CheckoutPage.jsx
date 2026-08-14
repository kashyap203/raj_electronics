import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaMoneyBillWave, FaCreditCard, FaLock, FaShieldAlt, FaMobileAlt, FaQrcode } from 'react-icons/fa';
import { useCart, useAuth } from '../context/AppContext';
import { orderService, deliveryCityService, paymentService } from '../services';
import { formatPrice, getDiscountedPrice, getImageUrl } from '../utils/helpers';
import { Alert } from '../components/common';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

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

  let totalOfferDiscount = 0;
  const isOnlinePayment = paymentMethod !== 'Cash on Delivery';

  items.forEach(item => {
    if (!item.product) return;
    const price = getDiscountedPrice(item.product.price, item.product.discount);
    const itemSubtotal = price * item.quantity;
    
    if (item.appliedOffer && isOnlinePayment) {
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
  const [deliveryCities, setDeliveryCities] = useState([]);
  
  useEffect(() => {
    deliveryCityService.getAll().then(res => setDeliveryCities(res.data)).catch(console.error);
  }, []);

  const isFreeDelivery = address.city && deliveryCities.some(
    c => c.cityName.toLowerCase() === address.city.trim().toLowerCase()
  );
  const shipping = address.city ? (isFreeDelivery ? 0 : 99) : 99;
  const total = Math.max(0, subtotal - couponDiscount - totalOfferDiscount) + shipping;

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
      const orderItems = items
        .filter(item => item.product && item.product._id)
        .map(item => ({ product: item.product._id, quantity: item.quantity }));

      const isOnline = paymentMethod !== 'Cash on Delivery';
      const actualPaymentMethod = isOnline ? 'Online Payment (Razorpay)' : 'Cash on Delivery';

      // 1. Create order record in backend
      const { data: createdOrder } = await orderService.create({
        orderItems,
        address,
        paymentMethod: actualPaymentMethod,
        couponCode: appliedCoupon || undefined,
      });

      // 2. If Cash on Delivery, complete flow immediately
      if (!isOnline) {
        await fetchCart();
        navigate(`/profile/orders/${createdOrder._id}`, { state: { success: true } });
        return;
      }

      // 3. Online Payment Flow (Razorpay or ICICI)
      if (paymentMethod === 'Online Payment (ICICI)') {
        // ICICI Payment Flow
        const { data: iciciData } = await paymentService.initiateICICIPayment(createdOrder._id);
        if (iciciData.success && iciciData.redirectURI) {
          window.location.href = iciciData.redirectURI;
        } else {
          setError('Failed to initiate ICICI payment.');
          setLoading(false);
        }
        return; // Execution stops here due to redirect
      }

      // Default to Razorpay if not ICICI
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError('Failed to load Razorpay SDK. Please check your internet connection.');
        setLoading(false);
        return;
      }

      // Create Razorpay Order via Payment API
      const { data: razorpayData } = await paymentService.createRazorpayOrder(createdOrder._id);

      const options = {
        key: razorpayData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TJpgLYHCfdOglV',
        amount: razorpayData.amount,
        currency: razorpayData.currency || 'INR',
        name: 'Raj Electronics',
        description: `Order #${createdOrder._id.slice(-8).toUpperCase()}`,
        order_id: razorpayData.razorpayOrderId,
        handler: async function (response) {
          try {
            // Verify HMAC SHA256 Signature on Backend
            await paymentService.verifyPayment({
              orderId: createdOrder._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            await fetchCart();
            navigate(`/profile/orders/${createdOrder._id}`, {
              state: { success: true, paymentSuccess: true },
            });
          } catch (verifyErr) {
            setError(verifyErr.response?.data?.message || 'Payment verification failed. Please contact support.');
            setLoading(false);
          }
        },
        prefill: {
          name: address.fullName || user?.name || '',
          email: user?.email || '',
          contact: address.phone || user?.phone || '',
        },
        theme: {
          color: '#E50914', // Raj Electronics Primary Red
        },
        modal: {
          ondismiss: async function () {
            try {
              await paymentService.handleFailure({
                orderId: createdOrder._id,
                reason: 'User closed Razorpay checkout modal',
              });
            } catch (err) {
              console.error(err);
            }
            setError('Payment was cancelled. You can retry payment anytime from My Orders.');
            setLoading(false);
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on('payment.failed', async function (response) {
        try {
          await paymentService.handleFailure({
            orderId: createdOrder._id,
            reason: response.error?.description || 'Razorpay Payment Failed',
          });
        } catch (err) {
          console.error(err);
        }
        setError(response.error?.description || 'Payment failed. Please try again or choose another payment method.');
        setLoading(false);
      });

      razorpayInstance.open();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Something went wrong');
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
              <h2 className="font-bold text-gray-800 mb-4">
                Payment Method
              </h2>
              <div className="space-y-3">
                {[
                  {
                    value: 'Cash on Delivery',
                    label: 'Cash on Delivery',
                    icon: FaMoneyBillWave,
                    badge: 'Zero Risk',
                    desc: 'Pay cash when your order is delivered to your doorstep',
                  },
                  {
                    value: 'Online Payment (Razorpay)',
                    label: 'Razorpay / Cards / UPI',
                    icon: FaCreditCard,
                    badge: 'Popular',
                    desc: 'Pay securely using Razorpay gateway',
                  },
                  {
                    value: 'Online Payment (ICICI)',
                    label: 'ICICI Orange PG',
                    icon: FaShieldAlt,
                    badge: 'Secure',
                    desc: 'Pay securely using ICICI Bank Orange Gateway',
                  },
                ].map(opt => (
                  <div key={opt.value} className={`rounded-xl border-2 transition overflow-hidden ${paymentMethod === opt.value ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>
                    <label className="flex items-start gap-4 p-4 cursor-pointer">
                      <input type="radio" name="payment" value={opt.value} checked={paymentMethod === opt.value} onChange={(e) => setPaymentMethod(e.target.value)} className="accent-primary mt-1" />
                      <opt.icon className="text-primary" size={22} />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-sm text-gray-800">{opt.label}</p>
                          {opt.badge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-green-100 text-green-700">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                      </div>
                    </label>
                  </div>
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
                {totalOfferDiscount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Bank Offers Applied</span>
                    <span>-{formatPrice(totalOfferDiscount)}</span>
                  </div>
                )}
                {!isOnlinePayment && items.some(i => i.appliedOffer) && (
                  <div className="text-red-500 text-xs mt-1">
                    Bank offers are not applicable for Cash on Delivery.
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
