import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaFilter, FaTimes, FaSearch } from 'react-icons/fa';
import ProductCard from '../components/ProductCard';
import { Loader, Pagination, EmptyState } from '../components/common';
import { productService, categoryService, brandService } from '../services';

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || '',
    inStock: searchParams.get('inStock') || '',
    featured: searchParams.get('featured') || '',
    bestSelling: searchParams.get('bestSelling') || '',
  });

  useEffect(() => {
    categoryService.getAll().then(r => setCategories(r.data)).catch(() => {});
    brandService.getAll().then(r => setBrands(r.data)).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async (currentPage = 1) => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: 12, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
      const { data } = await productService.getAll(params);
      setProducts(data.products);
      setPage(data.page);
      setPages(data.pages);
      setTotal(data.total);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchProducts(1); }, [fetchProducts]);

  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    const params = Object.fromEntries(Object.entries(newFilters).filter(([, v]) => v));
    setSearchParams(params);
    setShowFilters(false);
  };

  const clearFilters = () => {
    const reset = { search: '', category: '', brand: '', minPrice: '', maxPrice: '', sort: '', inStock: '', featured: '', bestSelling: '' };
    setFilters(reset);
    setSearchParams({});
  };

  const hasActiveFilters = Object.values(filters).some(v => v);

  const FilterPanel = () => (
    <div className="space-y-5">
      {/* Sort */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
        <select
          value={filters.sort}
          onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Best Rated</option>
          <option value="best_selling">Best Selling</option>
        </select>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
        <select
          value={filters.category}
          onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      {/* Brand */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Brand</label>
        <select
          value={filters.brand}
          onChange={e => setFilters(f => ({ ...f, brand: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="">All Brands</option>
          {brands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Price Range (₹)</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-2">
        {[
          { label: 'In Stock Only', key: 'inStock' },
          { label: 'Featured', key: 'featured' },
          { label: 'Best Selling', key: 'bestSelling' },
        ].map(({ label, key }) => (
          <label key={key} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={filters[key] === 'true'}
              onChange={e => setFilters(f => ({ ...f, [key]: e.target.checked ? 'true' : '' }))}
              className="accent-primary w-4 h-4"
            />
            {label}
          </label>
        ))}
      </div>

      <button onClick={() => applyFilters(filters)} className="w-full bg-primary hover:bg-primary-dark text-dark font-bold py-2.5 rounded-xl transition">
        Apply Filters
      </button>
      {hasActiveFilters && (
        <button onClick={clearFilters} className="w-full border border-gray-300 hover:bg-gray-50 text-gray-600 font-medium py-2.5 rounded-xl transition text-sm">
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Products</h1>
          {!loading && <p className="text-sm text-gray-500">{total} products found</p>}
        </div>
        <div className="flex gap-3">
          {hasActiveFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 border border-red-200 px-3 py-2 rounded-lg">
              <FaTimes size={12} /> Clear Filters
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-2 bg-dark text-white px-4 py-2 rounded-xl text-sm font-medium"
          >
            <FaFilter size={12} /> Filters
          </button>
        </div>
      </div>

      {/* Search bar */}
      <form onSubmit={e => { e.preventDefault(); applyFilters(filters); }} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            placeholder="Search products, brands..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
          />
        </div>
        <button type="submit" className="bg-primary hover:bg-primary-dark text-dark font-semibold px-5 py-2.5 rounded-xl transition text-sm">
          Search
        </button>
      </form>

      <div className="flex gap-6">
        {/* Desktop Filters */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm p-5 sticky top-24">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FaFilter size={14} /> Filters</h2>
            <FilterPanel />
          </div>
        </aside>

        {/* Mobile Filters */}
        {showFilters && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50 flex items-end">
            <div className="bg-white w-full rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">Filters</h2>
                <button onClick={() => setShowFilters(false)}><FaTimes /></button>
              </div>
              <FilterPanel />
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <Loader />
          ) : products.length === 0 ? (
            <EmptyState
              title="No products found"
              description="Try adjusting your filters or search terms"
              action={
                <button onClick={clearFilters} className="bg-primary text-dark font-semibold px-6 py-2 rounded-full hover:bg-primary-dark transition">
                  Clear Filters
                </button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
              <Pagination page={page} pages={pages} onPageChange={p => fetchProducts(p)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
