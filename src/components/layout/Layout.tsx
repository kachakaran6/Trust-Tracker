import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import BottomNav from "./BottomNav";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../lib/api";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingSplitCount, setPendingSplitCount] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    api.groups
      .getMySplitRequests()
      .then((reqs) => {
        const count = (reqs || []).filter(
          (r) => r.is_incoming && (r.status === "pending" || r.status === "accepted")
        ).length;
        setPendingSplitCount(count);
      })
      .catch(() => {});
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-[var(--bg)] text-[var(--text)] overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Desktop / Tablet Drawer) */}
      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        pendingSplitCount={pendingSplitCount}
      />

      {/* Main Content Shell */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar (<768px) */}
        <BottomNav pendingSplitCount={pendingSplitCount} />
      </div>
    </div>
  );
}

export default Layout;
