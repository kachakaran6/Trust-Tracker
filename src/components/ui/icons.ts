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
  Shield,
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
  HelpCircle,
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

const BaseIcons: Record<string, React.FC<IconProps>> = {
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
  Shield: createIcon(Shield),
  ShieldCheck: createIcon(ShieldCheck),

  // Actions
  Add: createIcon(Plus),
  Plus: createIcon(Plus),
  Edit: createIcon(Pencil),
  Pencil: createIcon(Pencil),
  Delete: createIcon(Trash2),
  Trash: createIcon(Trash2),
  Download: createIcon(Download),
  Export: createIcon(Download),
  Copy: createIcon(Copy),
  Share: createIcon(Share2),
  ExternalLink: createIcon(ExternalLink),
  Refresh: createIcon(RefreshCw),
  Repeat: createIcon(Repeat),
  Remind: createIcon(Bell),
  Bell: createIcon(Bell),
  LogOut: createIcon(LogOut),
  Settle: createIcon(Wallet),

  // Navigation / Controls
  Menu: createIcon(Menu),
  Close: createIcon(X),
  Back: createIcon(ArrowLeft),
  ArrowLeft: createIcon(ArrowLeft),
  ArrowRight: createIcon(ArrowRight),
  Forward: createIcon(ArrowRight),
  ArrowUpRight: createIcon(ArrowUpRight),
  ArrowDownRight: createIcon(ArrowDownRight),
  ChevronDown: createIcon(ChevronDown),
  ChevronUp: createIcon(ChevronUp),
  ChevronLeft: createIcon(ChevronLeft),
  ChevronRight: createIcon(ChevronRight),
  Expand: createIcon(ChevronDown),
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
  Pending: createIcon(Clock),
  TrendingUp: createIcon(TrendingUp),
  TrendingDown: createIcon(TrendingDown),

  // Appearance
  Sun: createIcon(Sun),
  Moon: createIcon(Moon),

  // Miscellaneous / Business
  Calendar: createIcon(Calendar),
  Clock: createIcon(Clock),
  FileText: createIcon(FileText),
  Receipt: createIcon(FileText),
  Wallet: createIcon(Wallet),
  Target: createIcon(Target),
  Smartphone: createIcon(Smartphone),
};

const FallbackIcon = createIcon(HelpCircle);

/**
 * Proxy wrapper ensuring that an unmapped icon name will NEVER return undefined
 * (which causes React Error #130) and instead gracefully renders a fallback.
 */
export const Icons = new Proxy(BaseIcons, {
  get(target, prop: string) {
    if (prop in target) {
      return target[prop];
    }
    // Return safe fallback component for undefined icon lookups
    return FallbackIcon;
  },
}) as Record<string, React.FC<IconProps>> & typeof BaseIcons;

export default Icons;
