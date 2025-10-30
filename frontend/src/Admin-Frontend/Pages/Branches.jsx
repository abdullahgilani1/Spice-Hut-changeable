import React, { useEffect, useState } from 'react';
import { branchAPI } from '../../services/api';

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(null); // branch being edited
  const [form, setForm] = useState({ name: '', addressLine: '', city: '', province: '', postalCode: '', phone: '' });

  const load = async () => {
    setLoading(true);
    try {
      const data = await branchAPI.getBranches();
      setBranches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load branches', err);
      setError(err?.response?.data?.message || err.message || 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ name: '', addressLine: '', city: '', province: '', postalCode: '', phone: '' }); };

  const openEdit = (b) => {
    setEditing(b);
    setForm({ name: b.name || '', addressLine: b.addressLine || '', city: b.city || '', province: b.province || '', postalCode: b.postalCode || '', phone: b.phone || '' });
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await branchAPI.updateBranch(editing._id, form);
      } else {
        await branchAPI.createBranch(form);
      }
      await load();
      setEditing(null);
    } catch (err) {
      console.error('Save failed', err);
      setError(err?.response?.data?.message || err.message || 'Save failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this branch?')) return;
    try {
      await branchAPI.deleteBranch(id);
      await load();
    } catch (err) {
      console.error('Delete failed', err);
      setError(err?.response?.data?.message || err.message || 'Delete failed');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Branches</h1>
        <div>
          <button onClick={openNew} className="px-4 py-2 bg-green-600 text-white rounded mr-2">New Branch</button>
          <button onClick={load} className="px-4 py-2 bg-gray-200 rounded">Refresh</button>
        </div>
      </div>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {branches.map(b => (
          <div key={b._id} className="border rounded p-4 bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{b.name}</h3>
                <div className="text-sm text-gray-600">{b.fullAddress}</div>
                {b.phone && <div className="text-sm text-gray-700">Phone: {b.phone}</div>}
              </div>
              <div className="space-x-2">
                <button onClick={() => openEdit(b)} className="px-3 py-1 bg-yellow-400 rounded">Edit</button>
                <button onClick={() => handleDelete(b._id)} className="px-3 py-1 bg-red-500 text-white rounded">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">{editing ? 'Edit Branch' : 'New Branch'}</h2>
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm">Name</label>
            <input name="name" value={form.name} onChange={handleChange} className="w-full border rounded px-2 py-1" required />
          </div>
          <div>
            <label className="block text-sm">City</label>
            <input name="city" value={form.city} onChange={handleChange} className="w-full border rounded px-2 py-1" required />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm">Address Line</label>
            <input name="addressLine" value={form.addressLine} onChange={handleChange} className="w-full border rounded px-2 py-1" required />
          </div>
          <div>
            <label className="block text-sm">Province</label>
            <input name="province" value={form.province} onChange={handleChange} className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm">Postal Code</label>
            <input name="postalCode" value={form.postalCode} onChange={handleChange} className="w-full border rounded px-2 py-1" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm">Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="w-full border rounded px-2 py-1" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded mr-2">Save</button>
            <button type="button" onClick={() => { setEditing(null); setForm({ name: '', addressLine: '', city: '', province: '', postalCode: '', phone: '' }); }} className="px-4 py-2 bg-gray-200 rounded">Clear</button>
          </div>
        </form>
      </div>
    </div>
  );
}
