import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationsContext";
import { Menu } from "lucide-react";

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

function Header({ setSidebarOpen }: HeaderProps) {
  const { user } = useAuth();
  // const { notifications, unreadCount, markAsRead } = useNotifications();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center px-4 md:px-6">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <Menu size={24} />
      </button>

      {/* Logo / Title */}
      <div className="flex-1">
        <a href="/" className="cursor-default">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Trust Tracker
          </h1>
        </a>
      </div>

      {/* Notifications dropdown */}
      <div className="relative">
        <button
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
        >
          {/* Example: you can put a bell icon here */}
          {/* <Bell size={20} /> */}
        </button>

        {notificationsOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Notifications
              </h3>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                      notification.read ? "" : "bg-blue-50 dark:bg-blue-900/30"
                    }`}
                    onClick={() => {
                      markAsRead(notification.id);
                      setNotificationsOpen(false);
                    }}
                  >
                    <div className="flex items-center mb-1">
                      <span
                        className={`w-2 h-2 rounded-full mr-2 ${
                          notification.type === "warning"
                            ? "bg-yellow-500"
                            : notification.type === "danger"
                            ? "bg-red-500"
                            : notification.type === "success"
                            ? "bg-green-500"
                            : "bg-blue-500"
                        }`}
                      ></span>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                        {notification.title}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {notification.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* User dropdown (simplified for now) */}
      <div className="ml-4">
        <button
          className="flex items-center"
          onClick={() => navigate("/settings")}
        >
          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold">
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        </button>
      </div>
    </header>
  );
}

export default Header;
