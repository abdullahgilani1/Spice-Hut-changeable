import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';

const LogoutButton = ({ className = "" }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={`flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors ${className}`}
      title={`Logout ${user?.firstName || 'User'}`}
    >
      <FiLogOut className="w-4 h-4" />
      <span className="hidden sm:inline">Logout</span>
    </button>
  );
};

export default LogoutButton;
