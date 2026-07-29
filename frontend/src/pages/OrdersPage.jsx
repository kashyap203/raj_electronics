import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingBag, FaChevronRight } from 'react-icons/fa';
import { orderService } from '../services';
import { Loader, EmptyState } from '../components/common';
import { formatPrice, getImageUrl } from '../utils/helpers';

const statusColors = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Processing: 'bg-blue-100 text-blue-700',
  Shipped: 'bg-purple-100 text-purple-700',
  Delivered: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService.getMyOrders()
      .then(r => setOrders(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <EmptyState
          icon={FaShoppingBag}
          title="No orders yet"
          description="Once you place an order, it will appear here"
          action={
            <Link to="/products" className="bg-primary text-dark font-bold px-8 py-3 rounded-full hover:bg-primary-dark transition inline-block">
              Start Shopping
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Link
              key={order._id}
              to={`/profile/orders/${order._id}`}
              className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition group animate-fade-in"
            >
              {/* Product thumbnails */}
              <div className="flex -space-x-3 shrink-0">
                {order.products.slice(0, 3).map((item, i) => (
                  <div key={i} className="w-12 h-12 rounded-full border-2 border-white bg-gray-50 overflow-hidden">
                    <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-contain p-1" />
                  </div>
                ))}
                {order.products.length > 3 && (
                  <div className="w-12 h-12 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                    +{order.products.length - 3}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-800 text-sm">Order #{order._id.slice(-8).toUpperCase()}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[order.status]}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {order.products.length} {order.products.length === 1 ? 'item' : 'items'} · {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="font-bold text-gray-800">{formatPrice(order.total)}</p>
                <FaChevronRight size={12} className="text-gray-400 ml-auto mt-1 group-hover:text-primary transition" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
