import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "../../contexts/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return null;
  }

  // const [showFooter, setShowFooter] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-gray-900 bg-opacity-50 dark:bg-black dark:bg-opacity-70 transition-opacity md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* <div className="p-4 text-center">
        <button
          onClick={() => setShowFooter(!showFooter)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showFooter ? "Disable Footer" : "Enable Footer"}
        </button>
      </div> */}

      {/* Main content area */}
      <div className="flex flex-col flex-1 w-full">
        <Header setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>

        {/* Footer (optional) */}
        {/* {showFooter && (
          <footer className="mt-auto bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>© 2025 FinSight. All rights reserved.</p>
          </footer>
        )} */}
      </div>
    </div>
  );
}

export default Layout;
