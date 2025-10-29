import React, { createContext, useContext, useState, useEffect } from 'react';
/* eslint-disable react-refresh/only-export-components */
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await authAPI.getProfile();
          if (response.success) {
            setUser(response.data.user);
            setToken(storedToken);
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch {
          console.error('Auth check failed');
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // User signup
  const signup = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authAPI.userSignup(userData);
      
      if (response.success) {
        const { user: newUser, token: newToken } = response.data;
        setUser(newUser);
        setToken(newToken);
        localStorage.setItem('token', newToken);
        return { success: true, user: newUser };
      } else {
        setError(response.message);
        return { success: false, error: response.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Signup failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Admin signup
  const adminSignup = async (adminData) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authAPI.adminSignup(adminData);
      
      if (response.success) {
        const { user: newUser, token: newToken } = response.data;
        setUser(newUser);
        setToken(newToken);
        localStorage.setItem('token', newToken);
        return { success: true, user: newUser };
      } else {
        setError(response.message);
        return { success: false, error: response.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Admin signup failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authAPI.login(email, password);
      // response is { token: ... }
      if (response && response.token) {
        setToken(response.token);
        localStorage.setItem('token', response.token);
        // Optionally decode user info from token
        let userInfo = null;
        try {
          const base64Url = response.token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          userInfo = JSON.parse(window.atob(base64));
        } catch {
          userInfo = null;
        }
        setUser(userInfo);
        return { success: true, user: userInfo };
      } else {
        setError('Login failed: No token received');
        return { success: false, error: 'Login failed: No token received' };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    setError(null);
  };

  // Get user profile
  const getProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      if (response.success) {
        setUser(response.data.user);
        return response.data.user;
      }
    } catch (error) {
      console.error('Get profile error:', error);
      // If profile fetch fails, user might be logged out
      logout();
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Check if user is admin
  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  // Check if user is regular user
  const isUser = () => {
    return user && user.role === 'user';
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user && !!token;
  };

  const value = {
    user,
    token,
    loading,
    error,
    signup,
    adminSignup,
    login,
    logout,
    getProfile,
    clearError,
    isAdmin,
    isUser,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
