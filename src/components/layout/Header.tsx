import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationsContext";
import { Bell, Menu } from "lucide-react";

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

function Header({ setSidebarOpen }: HeaderProps) {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 md:px-6">
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden mr-4 text-gray-500 hover:text-gray-700"
      >
        <Menu size={24} />
      </button>

      <div className="flex-1">
        <a href="/" className=" cursor-default ">
          <h1 className="text-xl font-semibold text-gray-800">Fintica</h1>
        </a>
      </div>

      {/* Notifications dropdown */}
      <div className="relative">
        <button
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-5 w-5 text-xs flex items-center justify-center bg-primary-600 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </button>

        {notificationsOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50">
            <div className="p-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold">Notifications</h3>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      notification.read ? "" : "bg-blue-50"
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
                            ? "bg-warning-500"
                            : notification.type === "danger"
                            ? "bg-danger-500"
                            : notification.type === "success"
                            ? "bg-success-500"
                            : "bg-primary-500"
                        }`}
                      ></span>
                      <p className="text-sm font-medium">
                        {notification.title}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600">
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
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        </button>
      </div>
    </header>
  );
}

export default Header;
