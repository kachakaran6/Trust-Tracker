import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useTransactions } from './TransactionsContext';
import { useBudget } from './BudgetContext';
import { format } from 'date-fns';

// Types
export interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success' | 'danger';
  title: string;
  message: string;
  date: string;
  read: boolean;
  userId: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

// Create the context
const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { transactions } = useTransactions();
  const { budgets, getBudgetSummary } = useBudget();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Calculate unread count
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Generate notifications based on user data
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const newNotifications: Notification[] = [];
    const currentMonth = format(new Date(), 'yyyy-MM');
    
    // Check for budget warnings
    const budgetSummary = getBudgetSummary(currentMonth);
    
    Object.entries(budgetSummary.categories).forEach(([categoryId, data]) => {
      if (data.percentage >= 90) {
        newNotifications.push({
          id: `notif-budget-${categoryId}`,
          type: 'warning',
          title: 'Budget Alert',
          message: `You've used ${Math.round(data.percentage)}% of your budget in a category.`,
          date: new Date().toISOString(),
          read: false,
          userId: user.id
        });
      }
    });
    
    // Add some default notifications
    newNotifications.push(
      {
        id: 'notif-welcome',
        type: 'info',
        title: 'Welcome to FinSight',
        message: 'Start tracking your finances to get personalized insights.',
        date: new Date().toISOString(),
        read: false,
        userId: user.id
      },
      {
        id: 'notif-prediction',
        type: 'success',
        title: 'Expense Prediction',
        message: 'Based on your data, we predict your expenses will decrease by 5% next month!',
        date: new Date().toISOString(),
        read: false,
        userId: user.id
      }
    );
    
    setNotifications(newNotifications);
  }, [user, transactions, budgets, getBudgetSummary]);

  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Delete a notification
  const deleteNotification = (id: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== id)
    );
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
  };

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}