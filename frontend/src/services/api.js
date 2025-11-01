// Profile API (backend integration)
export const profileAPI = {
  // Get current user's profile
  getProfile: async () => {
    return api.get('/profile');
  },

  // Update current user's profile
  updateProfile: async (profileData) => {
    return api.put('/profile', profileData);
  },

  // Change password with current password verification
  changePassword: async (payload) => {
    return api.put('/profile/password', payload);
  },

  // Get user addresses
  getAddresses: async () => {
    return api.get('/profile/addresses');
  },

  // Add new address
  addAddress: async (addressData) => {
    return api.post('/profile/addresses', addressData);
  },

  // Update address
  updateAddress: async (id, addressData) => {
    return api.put(`/profile/addresses/${id}`, addressData);
  },

  // Delete address
  deleteAddress: async (id) => {
    return api.delete(`/profile/addresses/${id}`);
  },
};
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  // For local development, always use localhost:5000
  baseURL: 'https://spicehut-8mqx.onrender.com/api',
  // Alternatively, use an environment variable if you need to switch between environments:
  // baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {

  // User signup
  userSignup: async (userData) => {
    return api.post('/auth/register', userData);
  },

  // Admin signup
  adminSignup: async (adminData) => {
    return api.post('/auth/register', adminData);
  },

  // Login
  login: async (email, password) => {
    return api.post('/auth/login', { email, password });
  },

  // Logout
  logout: async () => {
    return api.post('/auth/logout');
  },

  // Get profile
  getProfile: async () => {
    return api.get('/auth/profile');
  },

  // Verify user for password reset
  verifyUser: async (verificationData) => {
    return api.post('/auth/verify-user', verificationData);
  },

  // Reset password
  resetPassword: async (resetData) => {
    return api.post('/auth/reset-password', resetData);
  },
  // Verify email (code)
  verifyEmail: async (data) => {
    return api.post('/auth/verify-email', data);
  },
  // Resend verification code
  resendVerification: async (data) => {
    return api.post('/auth/resend-verification', data);
  },
};

// Menu API (for future use)
export const menuAPI = {
  // Get all menu items
  getMenuItems: async () => {
    return api.get('/menu');
  },

  // Get menu items by category
  getMenuByCategory: async (category) => {
    return api.get(`/menu/category/${category}`);
  },

  // Search menu items and categories
  searchMenu: async (query) => {
    return api.get('/menu/search', { params: { q: query } });
  },

  // Get single menu item
  getMenuItem: async (id) => {
    return api.get(`/menu/${id}`);
  },
  // Admin: create menu item
  createMenuItem: async (itemData) => {
    return api.post('/menu', itemData);
  },

  // Admin: update menu item
  updateMenuItem: async (id, itemData) => {
    return api.put(`/menu/${id}`, itemData);
  },

  // Admin: delete menu item
  deleteMenuItem: async (id) => {
    return api.delete(`/menu/${id}`);
  },
  // Admin: create menu item with file upload
  createMenuItemMultipart: async (formData) => {
    // don't let axios response interceptor assume JSON
    return api.post('/menu', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  // Admin: update menu item with file upload
  updateMenuItemMultipart: async (id, formData) => {
    return api.put(`/menu/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// Category API
export const categoryAPI = {
  getCategories: async () => {
    return api.get('/menu/categories');
  },
  createCategory: async (categoryData) => {
    return api.post('/menu/categories', categoryData);
  },
  createCategoryMultipart: async (formData) => {
    return api.post('/menu/categories', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  deleteCategory: async (id) => {
    return api.delete(`/menu/categories/${id}`);
  }
};

// Branch API
export const branchAPI = {
  // Public
  getBranches: async () => api.get('/branches'),
  getBranchByCity: async (city) => api.get('/branches/by-city', { params: { city } }),
  getBranch: async (id) => api.get(`/branches/${id}`),

  // Admin
  createBranch: async (data) => api.post('/branches', data),
  updateBranch: async (id, data) => api.put(`/branches/${id}`, data),
  deleteBranch: async (id) => api.delete(`/branches/${id}`),
};

// Order API (for future use)
export const orderAPI = {
  // Create order
  createOrder: async (orderData) => {
    return api.post('/orders', orderData);
  },

  // Get user orders
  getUserOrders: async () => {
    // endpoint returns orders for the authenticated user
    return api.get('/orders/my');
  },

  // Admin: get all orders
  getOrders: async () => {
    return api.get('/orders');
  },

  // Get order by ID
  getOrder: async (id) => {
    return api.get(`/orders/${id}`);
  },

  // Update order status (admin only)
  updateOrderStatus: async (id, status) => {
    return api.patch(`/orders/${id}/status`, { status });
  },
  // Update an existing order (owner/admin) - used by billing to apply loyalty points or final totals
  updateOrder: async (id, data) => {
    return api.put(`/orders/${id}`, data);
  },
};

// Content API
export const contentAPI = {
  // Get site content (About/Contact/Policies)
  getContent: async () => {
    return api.get('/content');
  },
  // Create or update content (admin only)
  upsertContent: async (contentData) => {
    return api.post('/content', contentData);
  }
};

// Utils API: server-side helpers (reverse geocode)
export const utilsAPI = {
  reverseGeocode: async (latitude, longitude) => api.post('/utils/reverse-geocode', { latitude, longitude }),
};


// Customer API (backend integration)
export const customerAPI = {
  // Get all customers
  getCustomers: async () => {
    return api.get('/customers');
  },

  // Delete a customer
  deleteCustomer: async (id) => {
    return api.delete(`/customers/${id}`);
  },
};


// Admin API (backend integration)
export const adminAPI = {
  // Get all admins
  getAdmins: async () => {
    return api.get('/admins');
  },

  // Add a new admin
  addAdmin: async (adminData) => {
    return api.post('/admins', adminData);
  },

  // Update an admin
  updateAdmin: async (id, adminData) => {
    return api.put(`/admins/${id}`, adminData);
  },

  // Delete an admin
  deleteAdmin: async (id) => {
    return api.delete(`/admins/${id}`);
  },
};

export default api;
