import { useEffect, useState, useRef } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaTimes, FaImage } from 'react-icons/fa';
import { productService, categoryService, brandService, offerService } from '../../services';
import { Loader, Alert, Pagination } from '../../components/common';
import { formatPrice, getDiscountedPrice, getImageUrl } from '../../utils/helpers';

const EMPTY_FORM = {
  name: '', brand: '', category: '', price: '', discount: '0', stock: '',
  description: '', featured: false, bestSelling: false,
  specifications: '', features: '', offers: [],
};

const ProductsAdminPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [allOffers, setAllOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef();

  const fetchProducts = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await productService.getAll({ page: p, limit: 10, search });
      setProducts(data.products);
      setPages(data.pages);
      setPage(data.page);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    categoryService.getAll().then(r => setCategories(r.data));
    brandService.getAll().then(r => setBrands(r.data));
    offerService.getActive().then(r => setAllOffers(r.data));
  }, []);

  useEffect(() => { fetchProducts(); }, [search]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setImages([]); setExistingImages([]); setShowModal(true); };
  const openEdit = (p) => {
    setEditing(p);
    const specs = p.specifications ? Object.entries(p.specifications).map(([k, v]) => `${k}: ${v}`).join('\n') : '';
    setForm({
      name: p.name, brand: p.brand?._id || '', category: p.category?._id || '',
      price: p.price, discount: p.discount, stock: p.stock,
      description: p.description, featured: p.featured, bestSelling: p.bestSelling,
      specifications: specs, features: p.features?.join('\n') || '',
      offers: p.offers?.map(o => (typeof o === 'string' ? o : o._id)) || [],
    });
    setExistingImages(p.images || []);
    setImages([]);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      const specs = {};
      if (form.specifications.trim()) {
        form.specifications.split('\n').forEach(line => {
          const [k, ...rest] = line.split(':');
          if (k && rest.length) specs[k.trim()] = rest.join(':').trim();
        });
      }
      const features = form.features.trim() ? form.features.split('\n').map(f => f.trim()).filter(Boolean) : [];
      Object.entries(form).forEach(([k, v]) => {
        if (k !== 'specifications' && k !== 'features' && k !== 'offers') fd.append(k, v);
      });
      fd.append('specifications', JSON.stringify(specs));
      fd.append('features', JSON.stringify(features));
      fd.append('offers', JSON.stringify(form.offers));
      if (editing) fd.append('existingImages', JSON.stringify(existingImages));
      images.forEach(img => fd.append('images', img));

      if (editing) {
        await productService.update(editing._id, fd);
      } else {
        await productService.create(fd);
      }
      setSuccess(editing ? 'Product updated!' : 'Product created!');
      setShowModal(false);
      fetchProducts(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await productService.delete(id);
      setSuccess('Product deleted');
      fetchProducts(page);
    } catch (err) {
      setError(err.message);
    }
  };

  const removeExistingImage = (img) => setExistingImages(e => e.filter(i => i !== img));

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h1 className="text-xl font-bold text-gray-800">Products</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-dark font-bold px-4 py-2 rounded-xl transition">
          <FaPlus size={12} /> Add Product
        </button>
      </div>

      <Alert message={error} type="error" onClose={() => setError('')} />
      <Alert message={success} type="success" onClose={() => setSuccess('')} />

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 flex gap-2">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none" />
        </div>
      </div>

      {loading ? <Loader /> : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400">No products found</td></tr>
                ) : products.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                          <img src={getImageUrl(p.images?.[0])} alt={p.name} className="w-full h-full object-contain p-1" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 line-clamp-1 max-w-[150px]">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.brand?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.category?.name}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{formatPrice(getDiscountedPrice(p.price, p.discount))}</p>
                      {p.discount > 0 && <p className="text-xs text-gray-400 line-through">{formatPrice(p.price)}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.stock > 0 ? p.stock : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {p.featured && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Featured</span>}
                        {p.bestSelling && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Best Seller</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"><FaEdit size={14} /></button>
                        <button onClick={() => handleDelete(p._id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition"><FaTrash size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4">
            <Pagination page={page} pages={pages} onPageChange={p => fetchProducts(p)} />
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="font-bold text-lg">{editing ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && <Alert message={error} type="error" onClose={() => setError('')} />}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">Product Name*</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category*</label>
                  <select required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none">
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Brand*</label>
                  <select required value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none">
                    <option value="">Select Brand</option>
                    {brands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price (₹)*</label>
                  <input required type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Discount (%)</label>
                  <input type="number" min="0" max="100" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stock*</label>
                  <input required type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" className="accent-primary" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} />
                    Featured
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" className="accent-primary" checked={form.bestSelling} onChange={e => setForm(f => ({ ...f, bestSelling: e.target.checked }))} />
                    Best Selling
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">Description*</label>
                  <textarea required rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none resize-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">Specifications (one per line: Key: Value)</label>
                  <textarea rows={3} value={form.specifications} onChange={e => setForm(f => ({ ...f, specifications: e.target.value }))}
                    placeholder="Screen Size: 55 inch&#10;Resolution: 4K UHD&#10;Smart TV: Yes"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none resize-none font-mono" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">Key Features (one per line)</label>
                  <textarea rows={3} value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))}
                    placeholder="4K Ultra HD Display&#10;Dolby Audio&#10;Smart TV with Netflix"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none resize-none" />
                </div>

                {/* <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-2">Available Bank Offers</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 border border-gray-200 rounded-xl p-3 max-h-40 overflow-y-auto">
                    {allOffers.length > 0 ? allOffers.map(offer => (
                      <label key={offer._id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white p-1 rounded transition">
                        <input 
                          type="checkbox" 
                          className="accent-primary" 
                          checked={form.offers.includes(offer._id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setForm(f => ({ ...f, offers: [...f.offers, offer._id] }));
                            } else {
                              setForm(f => ({ ...f, offers: f.offers.filter(id => id !== offer._id) }));
                            }
                          }}
                        />
                        <span className="truncate">{offer.bankName} - {offer.title}</span>
                      </label>
                    )) : (
                      <p className="text-xs text-gray-500">No active offers available</p>
                    )}
                  </div>
                </div> */}
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium mb-2">Product Images</label>
                {existingImages.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-2">
                    {existingImages.map((img, i) => (
                      <div key={i} className="relative w-16 h-16 bg-gray-50 rounded-lg overflow-hidden">
                        <img src={getImageUrl(img)} alt="" className="w-full h-full object-contain p-1" />
                        <button type="button" onClick={() => removeExistingImage(img)}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div
                  onClick={() => fileRef.current.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-primary transition"
                >
                  <FaImage className="text-gray-400 text-2xl mx-auto mb-1" />
                  <p className="text-sm text-gray-500">Click to upload images</p>
                  {images.length > 0 && <p className="text-xs text-primary mt-1">{images.length} file(s) selected</p>}
                </div>
                <input ref={fileRef} type="file" multiple accept="image/*" className="hidden"
                  onChange={e => setImages(Array.from(e.target.files))} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-60 text-dark font-bold py-2.5 rounded-xl transition">
                  {saving ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="border border-gray-300 px-6 py-2.5 rounded-xl hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsAdminPage;
