import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader } from '../components/common';
import { categoryService } from '../services';
import { getImageUrl } from '../utils/helpers';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryService.getAll()
      .then(r => setCategories(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Shop by Category</h1>
        <p className="text-gray-500">Browse our wide range of electronics categories</p>
      </div>

      {categories.length === 0 ? (
        <p className="text-center text-gray-500">No categories available.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map(cat => (
            <Link
              key={cat._id}
              to={`/products?category=${cat._id}`}
              className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group animate-fade-in"
            >
              <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                <img
                  src={getImageUrl(cat.image)}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4 text-center">
                <h2 className="font-bold text-gray-800 group-hover:text-primary transition">{cat.name}</h2>
                {cat.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cat.description}</p>}
                <p className="text-xs text-primary font-medium mt-2">Shop Now →</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
