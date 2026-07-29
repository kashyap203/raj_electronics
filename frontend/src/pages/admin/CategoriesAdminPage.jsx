import { useEffect, useState, useRef } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaImage } from 'react-icons/fa';
import { categoryService } from '../../services';
import { Loader, Alert } from '../../components/common';
import { getImageUrl } from '../../utils/helpers';

const CategoriesAdminPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef();

  const fetch = () => {
    setLoading(true);
    categoryService.getAll().then(r => setCategories(r.data)).finally(() => setLoading(false));
  };
  useEffect(fetch, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '' }); setImage(null); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, description: c.description || '' }); setImage(null); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      if (image) fd.append('image', image);
      if (editing) {
        await categoryService.update(editing._id, fd);
        setSuccess('Category updated!');
      } else {
        await categoryService.create(fd);
        setSuccess('Category created!');
      }
      setShowModal(false);
      fetch();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await categoryService.delete(id);
      setSuccess('Category deleted');
      fetch();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-gray-800">Categories</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-dark font-bold px-4 py-2 rounded-xl transition">
          <FaPlus size={12} /> Add Category
        </button>
      </div>

      <Alert message={error} type="error" onClose={() => setError('')} />
      <Alert message={success} type="success" onClose={() => setSuccess('')} />

      {loading ? <Loader /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.length === 0 ? (
            <p className="text-gray-400 col-span-full text-center py-8">No categories yet</p>
          ) : categories.map(cat => (
            <div key={cat._id} className="bg-white rounded-2xl shadow-sm overflow-hidden group">
              <div className="aspect-video bg-gray-50 overflow-hidden">
                <img src={getImageUrl(cat.image)} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-800">{cat.name}</h3>
                  {cat.description && <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{cat.description}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(cat)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"><FaEdit size={14} /></button>
                  <button onClick={() => handleDelete(cat._id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition"><FaTrash size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="font-bold text-lg">{editing ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && <Alert message={error} type="error" onClose={() => setError('')} />}
              <div>
                <label className="block text-sm font-medium mb-1">Category Name*</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Image</label>
                {editing?.image && !image && (
                  <img src={getImageUrl(editing.image)} alt="" className="w-full h-32 object-cover rounded-xl mb-2" />
                )}
                {image && <p className="text-xs text-primary mb-2">{image.name}</p>}
                <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-primary transition">
                  <FaImage className="text-gray-400 text-xl mx-auto mb-1" />
                  <p className="text-sm text-gray-500">Click to upload image</p>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => setImage(e.target.files[0])} />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-60 text-dark font-bold py-2.5 rounded-xl transition">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="border border-gray-300 px-6 py-2.5 rounded-xl hover:bg-gray-50 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesAdminPage;
