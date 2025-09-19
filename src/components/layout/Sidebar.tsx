import React, { useEffect, useState } from "react";
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
  Shield,
  Users,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

function Sidebar({ open, setOpen }: SidebarProps) {
  const { user, logout } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (error) console.error("Error fetching role:", error);
      else setIsSuperAdmin(data?.role === "super_admin");

      setLoadingRole(false);
    };

    if (user) fetchRole();
  }, [user]);

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
    {
      name: "Groups",
      path: "/group",
      icon: <Users size={20} />,
    },
    { name: "Settings", path: "/settings", icon: <Settings size={20} /> },
  ];

  const adminLink = {
    name: "Admin",
    path: "/admin",
    icon: <Shield size={20} />,
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out ${
        open ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 md:static`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <span className="text-primary-600 dark:text-primary-400 font-bold text-2xl">
            Trust Tracker
          </span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-primary-700 dark:text-primary-200 font-bold">
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="ml-3">
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {user.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user.email}
            </p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-1">
        {navLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-700 dark:text-primary-50"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`
            }
          >
            <span className="mr-3">{link.icon}</span>
            {link.name}
          </NavLink>
        ))}

        {!loadingRole && isSuperAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive
                  ? "bg-purple-50 text-purple-700 dark:bg-purple-700 dark:text-purple-50"
                  : "text-gray-700 hover:bg-purple-50 hover:text-purple-700 dark:text-gray-300 dark:hover:bg-purple-800 dark:hover:text-purple-200"
              }`
            }
          >
            <span className="mr-3">{adminLink.icon}</span>
            {adminLink.name}
          </NavLink>
        )}

        <a
          href="#"
          onClick={handleLogout}
          className="flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors duration-200"
        >
          <span className="mr-3 text-gray-500 dark:text-gray-400">
            <LogOut size={20} />
          </span>
          Logout
        </a>
      </nav>
    </div>
  );
}

export default Sidebar;
