import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  LayoutDashboard,
  CreditCard,
  BarChart2,
  PiggyBank,
  TrendingUp,
  Settings,
  LogOut,
  X,
} from "lucide-react";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

function Sidebar({ open, setOpen }: SidebarProps) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const navLinks = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    {
      name: "Transactions",
      path: "/transactions",
      icon: <CreditCard size={20} />,
    },
    { name: "Analytics", path: "/analytics", icon: <BarChart2 size={20} /> },
    { name: "Budget", path: "/budget", icon: <PiggyBank size={20} /> },
    {
      name: "Predictions",
      path: "/predictions",
      icon: <TrendingUp size={20} />,
    },
    { name: "Settings", path: "/settings", icon: <Settings size={20} /> },
  ];

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
  };

  return (
    <div
      className={`
      fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out
      ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static
    `}
    >
      {/* Sidebar header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <div className="flex items-center">
          <span className="text-primary-600 font-bold text-2xl">FinSight</span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="md:hidden text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation links */}
      <nav className="p-4 space-y-1">
        {navLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) => `
              flex items-center px-4 py-2.5 text-sm font-medium rounded-lg
              ${
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-700 hover:bg-gray-100"
              }
              transition-colors duration-200
            `}
          >
            <span className="mr-3">{link.icon}</span>
            {link.name}
          </NavLink>
        ))}

        {/* Logout button */}
        <a
          href="#"
          onClick={handleLogout}
          className="flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200"
        >
          <span className="mr-3 text-gray-500">
            <LogOut size={20} />
          </span>
          Logout
        </a>
      </nav>

      {/* User info */}
      {/* <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
            {user.name.charAt(0)}
          </div>
          <div className="ml-3">
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      </div> */}
    </div>
  );
}

export default Sidebar;
