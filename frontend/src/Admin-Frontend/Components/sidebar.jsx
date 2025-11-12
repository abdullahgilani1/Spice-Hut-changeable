import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiShoppingCart,
  FiSettings,
  FiUser,
  FiLogOut,
  FiX,
  FiBarChart,
  FiMapPin,
} from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import LogoutButton from "../../components/LogoutButton";

const links = [
  { to: "/admin", label: "Dashboard", icon: <FiBarChart /> },
  { to: "/admin/menumanagement", label: "Menu Management", icon: <FiHome /> },
  { to: "/admin/orders", label: "Orders", icon: <FiShoppingCart /> },
  { to: "/admin/customers", label: "Customers", icon: <FiUsers /> },
  { to: "/admin/admins", label: "Admins", icon: <FiUser /> },
  { to: "/admin/branches", label: "Branches", icon: <FiMapPin /> },
  { to: "/admin/settings", label: "Content Management", icon: <FiSettings /> },
];

export default function Sidebar({ collapsed, open, setOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Mobile: overlay sidebar
  const mobileSidebar = (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-transparent bg-opacity-70 z-90"
        onClick={() => setOpen(false)}
      />
      <aside className="fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-orange-400 to-orange-600 text-white flex flex-col justify-between z-100 shadow-lg transition-transform duration-300">
        <div>
          <div className="flex items-center justify-between p-4 border-b border-blue-800">
            <span className="text-2xl font-bold tracking-wide">Admin</span>
            <button
              className="text-gray-400 hover:text-white"
              onClick={() => setOpen(false)}
              aria-label="Close sidebar"
            >
              <FiX size={24} />
            </button>
          </div>
          <nav className="p-4">
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                      location.pathname === link.to
                        ? "bg-black shadow font-semibold"
                        : "hover:bg-gray-700 hover:shadow"
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="p-4 border-t border-blue-800 flex flex-col gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-black transition-colors"
            onClick={() => navigate("/admin/profile")}
          >
            <FiUser size={20} />
            Profile
          </button>
          <LogoutButton className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-white hover:text-white" />
        </div>
      </aside>
    </>
  );

  // Desktop: collapsible sidebar
  const desktopSidebar = (
    <aside
      className={`flex h-full bg-gradient-to-b from-orange-400 to-orange-600 text-white flex-col justify-between z-40 shadow-lg transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
      style={{ minWidth: collapsed ? "4rem" : "16rem" }}
    >
      <div>
        <div
          className={`flex items-center justify-between p-4 border-b border-white ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {!collapsed && (
            <span className="text-2xl font-bold tracking-wide">Admin</span>
          )}
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {links.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`flex items-center gap-3 px-2 py-2 rounded-lg transition-all justify-center ${
                    collapsed ? "" : "justify-start"
                  } ${
                    location.pathname === link.to
                      ? "bg-blue-600 shadow font-semibold"
                      : "hover:bg-blue-500 hover:shadow"
                  }`}
                  title={link.label}
                >
                  {link.icon}
                  {!collapsed && <span>{link.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="p-4 border-t border-white flex flex-col gap-3 items-center">
        {!collapsed && (
          <div className="w-full text-center mb-2">
            <p className="text-sm font-medium">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs opacity-75">
              {user?.adminProfile?.adminRole}
            </p>
          </div>
        )}
        <button
          className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-black transition-colors justify-center"
          onClick={() => navigate("/admin/profile")}
        >
          <FiUser size={20} />
          {!collapsed && <span>Profile</span>}
        </button>
        <LogoutButton className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-red-600 transition-colors justify-center text-white hover:text-white">
          <FiLogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </LogoutButton>
      </div>
    </aside>
  );

  return (
    <>
      {isDesktop && desktopSidebar}
      {!isDesktop && open && mobileSidebar}
    </>
  );
}
