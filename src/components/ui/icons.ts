import React from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Users,
  User,
  UserPlus,
  Landmark,
  Repeat,
  Handshake,
  Settings,
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Download,
  Sun,
  Moon,
  Menu,
  X,
  Bell,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  ListFilter,
  Filter,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  MoreHorizontal,
  Copy,
  Share2,
  ExternalLink,
  LogOut,
  AlertCircle,
  AlertTriangle,
  Info,
  RefreshCw,
  FileText,
  Calendar,
  Clock,
  Wallet,
  Target,
  Lock,
  Smartphone,
  LucideProps,
} from "lucide-react";

/**
 * Standard Icon Props
 * Adheres to Section 4 design specs:
 * - Default strokeWidth: 1.75
 * - Default size: 18 (nav & buttons), 16 (inline/pills), 20 (page headers/empty states)
 * - Color: inherits currentColor unless explicitly overridden
 */
export type IconProps = LucideProps;

function createIcon(Component: React.ComponentType<LucideProps>, defaultSize = 18) {
  const WrappedIcon: React.FC<IconProps> = ({
    size = defaultSize,
    strokeWidth = 1.75,
    className = "",
    ...props
  }) => {
    return React.createElement(Component, {
      size,
      strokeWidth,
      className: `shrink-0 ${className}`.trim(),
      ...props,
    });
  };
  WrappedIcon.displayName = Component.displayName || "AppIcon";
  return WrappedIcon;
}

export const Icons = {
  // Navigation & Core Features
  Dashboard: createIcon(LayoutDashboard),
  Transactions: createIcon(ArrowLeftRight),
  Analytics: createIcon(BarChart3),
  Budget: createIcon(PiggyBank),
  Predictions: createIcon(TrendingUp),
  Forecast: createIcon(TrendingUp),
  Diary: createIcon(BookOpen),
  Groups: createIcon(Users),
  Loans: createIcon(Landmark),
  Subscriptions: createIcon(Repeat),
  Debts: createIcon(Handshake),
  Settings: createIcon(Settings),
  Admin: createIcon(ShieldCheck),

  // Actions
  Add: createIcon(Plus),
  Edit: createIcon(Pencil),
  Delete: createIcon(Trash2),
  Download: createIcon(Download),
  Export: createIcon(Download),
  Copy: createIcon(Copy),
  Share: createIcon(Share2),
  ExternalLink: createIcon(ExternalLink),
  Refresh: createIcon(RefreshCw),
  Remind: createIcon(Bell),
  LogOut: createIcon(LogOut),

  // Navigation / Controls
  Menu: createIcon(Menu),
  Close: createIcon(X),
  Back: createIcon(ArrowLeft),
  ArrowRight: createIcon(ArrowRight),
  ArrowUpRight: createIcon(ArrowUpRight),
  ArrowDownRight: createIcon(ArrowDownRight),
  ChevronDown: createIcon(ChevronDown),
  ChevronUp: createIcon(ChevronUp),
  ChevronLeft: createIcon(ChevronLeft),
  ChevronRight: createIcon(ChevronRight),
  MoreVertical: createIcon(MoreVertical),
  MoreHorizontal: createIcon(MoreHorizontal),

  // Search & Filters
  Search: createIcon(Search),
  Filter: createIcon(ListFilter),
  ListFilter: createIcon(ListFilter),

  // Form & Auth
  Eye: createIcon(Eye),
  EyeOff: createIcon(EyeOff),
  Lock: createIcon(Lock),
  User: createIcon(User),
  UserPlus: createIcon(UserPlus),

  // Status & Indicators
  Check: createIcon(Check),
  CheckCircle: createIcon(CheckCircle2),
  Alert: createIcon(AlertCircle),
  Warning: createIcon(AlertTriangle),
  Info: createIcon(Info),
  TrendingUp: createIcon(TrendingUp),
  TrendingDown: createIcon(TrendingDown),

  // Appearance
  Sun: createIcon(Sun),
  Moon: createIcon(Moon),

  // Miscellaneous / Business
  Calendar: createIcon(Calendar),
  Clock: createIcon(Clock),
  FileText: createIcon(FileText),
  Wallet: createIcon(Wallet),
  Target: createIcon(Target),
  Smartphone: createIcon(Smartphone),
};

export default Icons;
