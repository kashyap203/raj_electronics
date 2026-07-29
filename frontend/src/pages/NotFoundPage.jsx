import { Link } from 'react-router-dom';
import { FaHome, FaSearch } from 'react-icons/fa';

const NotFoundPage = () => (
  <div className="min-h-screen bg-gradient-to-br from-dark via-dark-light to-dark flex items-center justify-center px-4">
    <div className="text-center text-white animate-fade-in">
      <div className="text-8xl font-black text-primary mb-4">404</div>
      <h1 className="text-3xl font-bold mb-3">Page Not Found</h1>
      <p className="text-gray-400 mb-8 max-w-md mx-auto">
        Oops! The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-4 justify-center flex-wrap">
        <Link
          to="/"
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-dark font-bold px-6 py-3 rounded-full transition"
        >
          <FaHome /> Go Home
        </Link>
        <Link
          to="/products"
          className="flex items-center gap-2 border-2 border-white hover:bg-white hover:text-dark text-white font-semibold px-6 py-3 rounded-full transition"
        >
          <FaSearch /> Browse Products
        </Link>
      </div>
    </div>
  </div>
);

export default NotFoundPage;
