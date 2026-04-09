import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Video, MessageSquare, LogOut, User, Home } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  if (!isAuthenticated) {
    return (
      <nav className="bg-white shadow-md border-b border-secondary-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Video className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-secondary-900">Smart Meet Pro</span>
            </Link>
            <div className="flex space-x-4">
              <Link
                to="/login"
                className="btn btn-outline px-4 py-2"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn btn-primary px-4 py-2"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-md border-b border-secondary-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <Video className="w-8 h-8 text-primary-600" />
            <span className="text-xl font-bold text-secondary-900">Smart Meet Pro</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/dashboard"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                isActivePath('/dashboard')
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            
            <Link
              to="/meeting/new"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                isActivePath('/meeting/new')
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>New Meeting</span>
            </Link>
            
            <Link
              to="/chat"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                isActivePath('/chat')
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              <span className="text-sm font-medium text-secondary-700 hidden sm:block">
                {user?.name}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-secondary-600 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
