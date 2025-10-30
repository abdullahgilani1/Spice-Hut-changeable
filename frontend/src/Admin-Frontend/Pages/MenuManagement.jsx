import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiFilter } from "react-icons/fi";
import { menuAPI, categoryAPI } from "../../services/api";

const defaultCategories = [
  'All',
  'appetizers',
  'butter dishes',
  'korma dishes',
  'curry dishes',
  'masala dishes',
  'coconut curry dishes',
  'tandoori dishes',
  'biryani dishes',
  'karahi dishes',
  'vindaloo dishes',
  'jalfrezi dishes',
  'palak dishes',
  'mango curry dishes',
  'vegetable dishes',
  'indian naan bread',
  'salads & sides',
  'indian deserts',
  'spice hut special combo'
];

export default function MenuManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [categories, setCategories] = useState(defaultCategories.map(n => ({ name: n })));
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // derive backend origin from API URL (strip trailing /api)
  const API_BASE = 'https://spicehut-8mqx.onrender.com/api'

  const fetchItems = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await menuAPI.getMenuItems();
      setItems(data || []);
    } catch {
      setError('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  }

  const fetchCategories = async () => {
    try {
      const data = await categoryAPI.getCategories();
      if (Array.isArray(data)) {
        const mapped = [{ name: 'All' }, ...data.map(c => ({ _id: c._id, name: c.name, description: c.description }))];
        setCategories(mapped);
        console.log('fetchCategories -> loaded', mapped.length, 'categories', mapped);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  }

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => { fetchCategories(); }, []);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || (item.category && item.category.toLowerCase() === selectedCategory.toLowerCase()) || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Add menu item handler (very small client-side form)
  const handleAddItem = async (e) => {
    e.preventDefault();
    const form = e.target;
    // read form values
    const name = form.name.value.trim();
    const category = form.category.value;
    const price = parseFloat(form.price.value) || 0;
    const description = form.description?.value || '';
    const subCategory = form.subCategory?.value || '';

    // If a file input exists, read it as data URL and save to localStorage
    const fileInput = form.imageFile;
    let imageValue = form.image?.value || '';
    if (fileInput && fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      imageValue = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Save to browser localStorage under a sanitized key
      const sanitize = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const key = `menu-image-${sanitize(name)}`;
      try { localStorage.setItem(key, imageValue); } catch (err) { console.warn('localStorage save failed', err); }
    }

    try {
      const file = fileInput && fileInput.files && fileInput.files[0];
      if (file) {
        const fd = new FormData();
        fd.append('name', name);
        fd.append('category', category);
        fd.append('price', price);
        fd.append('description', description);
        fd.append('subCategory', subCategory);
        fd.append('imageFile', file);
        await menuAPI.createMenuItemMultipart(fd);
      } else {
        const newItem = { name, category, price, status: 'Available', image: imageValue, description, subCategory };
        await menuAPI.createMenuItem(newItem);
      }
      setShowAddModal(false);
      setPreview('');
      fetchItems();
    } catch (err) {
      console.error('Failed to add item', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to add item';
      alert(msg);
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this menu item?')) return;
    try {
      await menuAPI.deleteMenuItem(id);
      fetchItems();
    } catch (err) {
      console.error('Failed to delete item', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete item';
      alert(msg);
    }
  }

  const openEditModal = (item) => {
    setEditItem(item);
    setPreview(item.image || '');
    setShowEditModal(true);
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    const form = e.target;
    const name = form.name.value.trim();
    const category = form.category.value;
    const price = parseFloat(form.price.value) || 0;
    const description = form.description?.value || '';
    const subCategory = form.subCategory?.value || '';
    const fileInput = form.imageFile;

    try {
      const file = fileInput && fileInput.files && fileInput.files[0];
      if (file) {
        const fd = new FormData();
        fd.append('name', name);
        fd.append('category', category);
        fd.append('price', price);
        fd.append('description', description);
        fd.append('subCategory', subCategory);
        fd.append('imageFile', file);
        await menuAPI.updateMenuItemMultipart(editItem._id, fd);
      } else {
        await menuAPI.updateMenuItem(editItem._id, { name, category, price, description, subCategory });
      }
      setShowEditModal(false);
      setEditItem(null);
      setPreview('');
      fetchItems();
    } catch (err) {
      console.error('Failed to update item', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to update item';
      alert(msg);
    }
  }

  const _toggleStatus = async (item) => {
    try {
      await menuAPI.updateMenuItem(item._id, { status: item.status === 'Available' ? 'Out of Stock' : 'Available' });
      fetchItems();
    } catch {
      alert('Failed to update status');
    }
  }

  return (
    <main className="p-4 md:p-8 lg:p-12 font-sans min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Menu Management</h1>
        <p className="text-gray-600 text-lg">Manage your restaurant's menu items and categories.</p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            {categories.map(c => (
              <option key={c._id || c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Menu Items Grid */}
      {/* Categories list (clickable) */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <button key={c._id || c.name} onClick={() => { setSelectedCategory(c.name); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`px-3 py-1 rounded-full text-sm font-medium ${selectedCategory === c.name ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <div key={item._id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="aspect-square bg-gray-200 relative">
              <img
                src={item.image && item.image.startsWith('/uploads') ? `${API_BASE}${item.image}` : item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 flex gap-2">
                <button onClick={() => openEditModal(item)} className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors">
                  <FiEdit className="w-4 h-4 text-gray-600" />
                </button>
                <button onClick={() => handleDelete(item._id)} className="p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors">
                  <FiTrash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  item.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {item.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{item.category}</p>
              <p className="text-lg font-bold text-gray-900">${item.price}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">{error}</div>
      ) : filteredItems.length === 0 && (
        <div className="text-center py-12">
          <FiSearch className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No menu items found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Add Menu Item Button */}
      <div className="flex justify-center mt-8">
        <div className="flex gap-4">
          {selectedCategory && selectedCategory !== 'All' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 flex items-center text-lg font-semibold"
            >
              <FiPlus className="mr-2" />
              Add Menu Item
            </button>
          )}
          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 flex items-center text-lg font-semibold"
          >
            + Add Category
          </button>
        </div>
      </div>

      {/* Add Menu Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Menu Item</h2>
            <form className="space-y-4" onSubmit={handleAddItem}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter item name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select name="category" defaultValue={selectedCategory} required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                  {categories.length ? categories.filter(c=>c.name!=='All').map(category => (
                    <option key={category._id || category.name} value={category.name}>{category.name}</option>
                  )) : (
                    <option value="">No categories</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image URL (optional)</label>
                <input name="image" type="text" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" placeholder="/images/item.jpg" />
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Or upload image</label>
                  <input name="imageFile" type="file" accept="image/*" onChange={(ev) => {
                    const f = ev.target.files && ev.target.files[0];
                    if (!f) { setPreview(''); return; }
                    const reader = new FileReader();
                    reader.onload = () => { setPreview(reader.result); };
                    reader.readAsDataURL(f);
                  }} className="w-full" />
                  {preview && (
                    <div className="mt-3">
                      <img src={preview} className="w-32 h-32 object-cover rounded" alt="preview" />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sub Category</label>
                <select name="subCategory" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                  <option value="">None</option>
                  <option value="LF">LF (Lactose Free)</option>
                  <option value="GF">GF (Gluten Free)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                <input name="description" type="text" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" placeholder="Short description" />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-colors"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Menu Item Modal */}
      {showEditModal && editItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Menu Item</h2>
            <form className="space-y-4" onSubmit={handleEditSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
                <input name="name" defaultValue={editItem.name} type="text" required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select name="category" defaultValue={editItem.category} required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                  {categories.length ? categories.filter(c => c.name !== 'All').map(category => (
                    <option key={category._id || category.name} value={category.name}>{category.name}</option>
                  )) : (
                    <option value="">No categories</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                <input name="price" defaultValue={editItem.price} type="number" step="0.01" required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Or replace image</label>
                <input name="imageFile" type="file" accept="image/*" onChange={(ev) => {
                  const f = ev.target.files && ev.target.files[0];
                  if (!f) { setPreview(editItem.image || ''); return; }
                  const reader = new FileReader();
                  reader.onload = () => { setPreview(reader.result); };
                  reader.readAsDataURL(f);
                }} className="w-full" />
                {preview && (
                  <div className="mt-3">
                    <img src={preview} className="w-32 h-32 object-cover rounded" alt="preview" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sub Category</label>
                <select name="subCategory" defaultValue={editItem.subCategory || ''} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                  <option value="">None</option>
                  <option value="LF">LF (Lactose Free)</option>
                  <option value="GF">GF (Gluten Free)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                <input name="description" defaultValue={editItem.description || ''} type="text" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowEditModal(false); setEditItem(null); setPreview(''); }} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-colors">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Category</h2>
            <form className="space-y-4" onSubmit={async (e) => {
              e.preventDefault();
              const name = e.target.name.value.trim();
              const description = e.target.description?.value || '';
              const slug = e.target.slug?.value || '';
              const fileInput = e.target.imageFile;
              if (!name) return alert('Category name is required');
              if (!fileInput || !fileInput.files || !fileInput.files[0]) return alert('Please choose an image file');
              try {
                const fd = new FormData();
                fd.append('name', name);
                fd.append('description', description);
                fd.append('slug', slug);
                fd.append('imageFile', fileInput.files[0]);
                const created = await categoryAPI.createCategoryMultipart(fd);
                if (created && created.name) {
                  setCategories(prev => {
                    const exists = prev.find(c => (c._id && c._id === created._id) || (c.name && c.name.toLowerCase() === created.name.toLowerCase()));
                    if (exists) return prev;
                    const head = prev.length && prev[0] && prev[0].name === 'All' ? [prev[0]] : [];
                    return [...head, { _id: created._id, name: created.name, description: created.description, image: created.image || '', slug: created.slug || '' }, ...prev.slice(head.length)];
                  });
                  setSelectedCategory(created.name);
                }
                setShowAddCategoryModal(false);
                fetchCategories();
              } catch (err) {
                const msg = err?.response?.data?.message || err?.message || 'Failed to create category';
                alert(msg);
              }
            }}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
                <input name="name" type="text" required className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                <input name="description" type="text" className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Browse Image (required)</label>
                <input name="imageFile" type="file" accept="image/*" className="w-full" onChange={(ev) => {
                  const f = ev.target.files && ev.target.files[0];
                  if (!f) { setPreview(''); return; }
                  const reader = new FileReader();
                  reader.onload = () => { setPreview(reader.result); };
                  reader.readAsDataURL(f);
                }} />
                {preview && (
                  <div className="mt-3">
                    <img src={preview} className="w-32 h-32 object-cover rounded" alt="preview" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Slug (optional)</label>
                <input name="slug" type="text" className="w-full px-4 py-3 border border-gray-300 rounded-xl" placeholder="e.g., butter-dishes" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddCategoryModal(false)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl">Add Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
