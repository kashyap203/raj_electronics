import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingBag, FaBox, FaUsers, FaRupeeSign, FaChartLine, FaClock } from 'react-icons/fa';
import { orderService, productService, userService } from '../../services';
import { Loader } from '../../components/common';
import { formatPrice, getImageUrl } from '../../utils/helpers';

const DashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      orderService.getSalesSummary(),
      orderService.getAll({ limit: 5 }),
      productService.getAll({ sort: 'best_selling', limit: 5 }),
      userService.getAll(),
    ]).then(([sum, orders, prods, users]) => {
      setSummary({ ...sum.data, totalUsers: users.data.length });
      setRecentOrders(orders.data.slice(0, 5));
      setTopProducts(prods.data.products || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const statusColors = {
    Pending: 'bg-yellow-100 text-yellow-700',
    Processing: 'bg-blue-100 text-blue-700',
    Shipped: 'bg-purple-100 text-purple-700',
    Delivered: 'bg-green-100 text-green-700',
    Cancelled: 'bg-red-100 text-red-700',
  };

  const stats = [
    { label: 'Total Revenue', value: formatPrice(summary?.totalSales || 0), icon: FaRupeeSign, color: 'bg-green-500', change: '+12% this month' },
    { label: 'Total Orders', value: summary?.totalOrders || 0, icon: FaShoppingBag, color: 'bg-blue-500', change: `${summary?.pendingOrders || 0} pending` },
    { label: 'Delivered Orders', value: summary?.deliveredOrders || 0, icon: FaChartLine, color: 'bg-primary', change: 'Successfully delivered' },
    { label: 'Total Users', value: summary?.totalUsers || 0, icon: FaUsers, color: 'bg-purple-500', change: 'Registered customers' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {stats.map(({ label, value, icon: Icon, color, change }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition">
            <div className={`${color} p-3 rounded-xl text-white shrink-0`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">{label}</p>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
              <p className="text-xs text-gray-400 mt-1">{change}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 flex items-center gap-2"><FaClock className="text-primary" size={14} /> Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm text-primary hover:underline">View All</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">No orders yet</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentOrders.map(order => (
                <div key={order._id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">#{order._id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-gray-500">{order.user?.name} · {order.products.length} items</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-800">{formatPrice(order.total)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status]}`}>{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 flex items-center gap-2"><FaBox className="text-primary" size={14} /> Top Products</h2>
            <Link to="/admin/products" className="text-sm text-primary hover:underline">View All</Link>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">No products yet</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {topProducts.map(p => (
                <div key={p._id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition">
                  <div className="w-10 h-10 bg-gray-50 rounded-lg shrink-0 overflow-hidden">
                    <img src={getImageUrl(p.images?.[0])} alt={p.name} className="w-full h-full object-contain p-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 line-clamp-1">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.salesCount || 0} sold · Stock: {p.stock}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-800 shrink-0">{formatPrice(p.price)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
