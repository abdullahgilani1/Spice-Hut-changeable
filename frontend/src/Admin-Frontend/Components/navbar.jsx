import { FiMenu } from "react-icons/fi";
import { useLocation } from "react-router-dom";

export default function Navbar({ setSidebarCollapsed, setSidebarOpen }) {
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/admin":
        return "Dashboard";
      case "/admin/menumanagement":
        return "Menu Management";
      case "/admin/customers":
        return "Customers";
      case "/admin/orders":
        return "Orders";
      case "/admin/reports":
        return "Reports";
      case "/admin/settings":
        return "Content Management";
      default:
        return "Admin Panel";
    }
  };

  return (
    <header className="bg-white shadow flex flex-row items-center px-4 py-3 rounded-b-2xl">
      {/* Hamburger for desktop: collapse sidebar */}
      <button
        className="hidden md:inline-block text-blue-700 p-2 rounded hover:bg-blue-100 mr-2"
        onClick={() => setSidebarCollapsed((prev) => !prev)}
        aria-label="Toggle sidebar"
      >
        <FiMenu size={24} />
      </button>
      {/* Hamburger for mobile: open sidebar */}
      <button
        className="md:hidden text-blue-700 p-2 rounded hover:bg-blue-100 mr-2"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        <FiMenu size={24} />
      </button>
      <h1 className="font-bold text-lg md:text-xl tracking-wide mb-0">{getPageTitle()}</h1>
    </header>
  );
}
