import { Link } from 'react-router-dom';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

export const StarRating = ({ rating, size = 14 }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      stars.push(<FaStar key={i} size={size} className="text-amber-400" />);
    } else if (rating >= i - 0.5) {
      stars.push(<FaStarHalfAlt key={i} size={size} className="text-amber-400" />);
    } else {
      stars.push(<FaRegStar key={i} size={size} className="text-gray-300" />);
    }
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
};

export const Loader = ({ size = 'md' }) => {
  const sizes = { sm: 'h-6 w-6', md: 'h-10 w-10', lg: 'h-16 w-16' };
  return (
    <div className="flex justify-center items-center py-12">
      <div className={`${sizes[size]} border-4 border-primary border-t-transparent rounded-full animate-spin`} />
    </div>
  );
};

export const Alert = ({ type = 'error', message, onClose }) => {
  const colors = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };
  if (!message) return null;
  return (
    <div className={`border rounded-lg px-4 py-3 mb-4 flex justify-between items-center ${colors[type]}`}>
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="ml-4 font-bold hover:opacity-70">&times;</button>
      )}
    </div>
  );
};

export const Breadcrumb = ({ items }) => (
  <nav className="text-sm text-gray-500 mb-4">
    {items.map((item, i) => (
      <span key={i}>
        {i > 0 && <span className="mx-2">/</span>}
        {item.link ? (
          <Link to={item.link} className="hover:text-primary">{item.label}</Link>
        ) : (
          <span className="text-gray-800">{item.label}</span>
        )}
      </span>
    ))}
  </nav>
);

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="text-center py-16 animate-fade-in">
    {Icon && <Icon className="mx-auto text-6xl text-gray-300 mb-4" />}
    <h3 className="text-xl font-semibold text-gray-700 mb-2">{title}</h3>
    <p className="text-gray-500 mb-6">{description}</p>
    {action}
  </div>
);

export const Pagination = ({ page, pages, onPageChange }) => {
  if (pages <= 1) return null;
  return (
    <div className="flex justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-4 py-2 rounded-full border border-gray-300 disabled:opacity-50 hover:bg-gray-100 transition"
      >
        Previous
      </button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`px-4 py-2 rounded-full transition ${
            p === page ? 'bg-primary text-white' : 'border border-gray-300 hover:bg-gray-100'
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pages}
        className="px-4 py-2 rounded-full border border-gray-300 disabled:opacity-50 hover:bg-gray-100 transition"
      >
        Next
      </button>
    </div>
  );
};
