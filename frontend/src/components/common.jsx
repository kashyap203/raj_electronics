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

  const getPageNumbers = () => {
    const pagesToShow = [];
    if (pages <= 5) {
      for (let i = 1; i <= pages; i++) pagesToShow.push(i);
    } else {
      if (page <= 3) {
        pagesToShow.push(1, 2, 3, 4, '...', pages);
      } else if (page >= pages - 2) {
        pagesToShow.push(1, '...', pages - 3, pages - 2, pages - 1, pages);
      } else {
        pagesToShow.push(1, '...', page - 1, page, page + 1, '...', pages);
      }
    }
    return pagesToShow;
  };

  return (
    <div className="mt-8 w-full flex flex-col items-center">
      {/* Mobile Layout */}
      <div className="flex sm:hidden w-full max-w-[300px] justify-between items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-4 py-2 text-sm rounded-full border border-gray-300 disabled:opacity-50 hover:bg-gray-100 transition"
        >
          Prev
        </button>
        <span className="text-sm text-gray-600 font-medium whitespace-nowrap">
          Page {page} of {pages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="px-4 py-2 text-sm rounded-full border border-gray-300 disabled:opacity-50 hover:bg-gray-100 transition"
        >
          Next
        </button>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex justify-center items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-4 py-2 text-sm rounded-full border border-gray-300 disabled:opacity-50 hover:bg-gray-100 transition shrink-0"
        >
          Previous
        </button>
        
        {getPageNumbers().map((p, index) => {
          if (p === '...') {
            return (
              <span key={`dots-${index}`} className="px-1 text-gray-500 flex items-center justify-center shrink-0">
                ...
              </span>
            );
          }
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-9 h-9 text-sm flex items-center justify-center rounded-full transition shrink-0 ${
                p === page ? 'bg-primary text-white font-medium' : 'border border-gray-300 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          );
        })}
        
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="px-4 py-2 text-sm rounded-full border border-gray-300 disabled:opacity-50 hover:bg-gray-100 transition shrink-0"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', type = 'danger' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in-up">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 text-sm mb-6">{message}</p>
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">Cancel</button>
            <button onClick={onConfirm} className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition ${type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary-dark'}`}>{confirmText}</button>
          </div>
        </div>
      </div>
    </div>
  );
};
