import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  isAuthenticated: false,
};

// Action types
const AUTH_START = 'AUTH_START';
const AUTH_SUCCESS = 'AUTH_SUCCESS';
const AUTH_FAILURE = 'AUTH_FAILURE';
const LOGOUT = 'LOGOUT';
const LOAD_USER = 'LOAD_USER';

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_START:
      return {
        ...state,
        isLoading: true,
      };
    case AUTH_SUCCESS:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
      };
    case AUTH_FAILURE:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
      };
    case LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
      };
    case LOAD_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set axios default headers
  useEffect(() => {
    if (state.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
      localStorage.setItem('token', state.token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [state.token]);

  // Load user on startup
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get('/api/auth/me');
          dispatch({ type: LOAD_USER, payload: response.data.user });
        } catch (error) {
          console.error('Failed to load user:', error);
          dispatch({ type: AUTH_FAILURE });
          localStorage.removeItem('token');
        }
      }
    };
    loadUser();
  }, []);

  // Register user
  const register = async (formData) => {
    try {
      dispatch({ type: AUTH_START });
      
      const response = await axios.post('/api/auth/register', formData);
      
      dispatch({
        type: AUTH_SUCCESS,
        payload: {
          user: response.data.user,
          token: response.data.token,
        },
      });
      
      toast.success('Registration successful!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      dispatch({ type: AUTH_FAILURE });
      throw error;
    }
  };

  // Login user
  const login = async (formData) => {
    try {
      dispatch({ type: AUTH_START });
      
      const response = await axios.post('/api/auth/login', formData);
      
      dispatch({
        type: AUTH_SUCCESS,
        payload: {
          user: response.data.user,
          token: response.data.token,
        },
      });
      
      toast.success('Login successful!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      dispatch({ type: AUTH_FAILURE });
      throw error;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: LOGOUT });
      toast.success('Logged out successfully');
    }
  };

  const value = {
    ...state,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
