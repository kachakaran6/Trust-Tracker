import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { TransactionsProvider } from "./contexts/TransactionsContext";
import { CategoriesProvider } from "./contexts/CategoriesContext";
import { BudgetProvider } from "./contexts/BudgetContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import { PageHeaderProvider } from "./contexts/PageHeaderContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { ThemeProvider } from "./contexts/ThemeProvider";
import { Skeleton } from "./components/ui/Skeleton";
import { Toaster } from "sonner";

// Lazy-loaded Pages
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Budget = lazy(() => import("./pages/Budget"));
const Settings = lazy(() => import("./pages/Settings"));
const Predictions = lazy(() => import("./pages/Predictions"));
const Admin = lazy(() => import("./pages/Admin"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Preview = lazy(() => import("./pages/Preview"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));
const Groups = lazy(() => import("./pages/Group"));
const GroupDetail = lazy(() => import("./pages/GroupDetail"));
const JoinGroup = lazy(() => import("./pages/JoinGroup"));
const Loans = lazy(() => import("./pages/Loans"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const Debts = lazy(() => import("./pages/Debts"));
const DiaryTransactionInput = lazy(() => import("./pages/DiaryTransactionInput"));
const SessionAnalytics = lazy(() => import("./pages/SessionAnalytics"));

function PageLoader() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-pulse">
      <Skeleton height={40} width={240} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton height={100} />
        <Skeleton height={100} />
        <Skeleton height={100} />
        <Skeleton height={100} />
      </div>
      <Skeleton height={320} />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Router>
        <Toaster position="bottom-right" richColors />
        <AuthProvider>
          <TransactionsProvider>
            <CategoriesProvider>
              <BudgetProvider>
                <NotificationsProvider>
                  <PageHeaderProvider>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        {/* Public routes */}
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/auth/callback" element={<AuthCallback />} />
                        <Route path="/session/:id" element={<SessionAnalytics />} />
                        <Route path="/join-group/:code" element={<JoinGroup />} />
                        <Route path="/invite/:code" element={<JoinGroup />} />
                        <Route
                          path="/update-password"
                          element={<UpdatePassword />}
                        />

                        {/* Protected routes */}
                        <Route element={<ProtectedRoute />}>
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/transactions" element={<Transactions />} />
                          <Route path="/analytics" element={<Analytics />} />
                          <Route path="/budget" element={<Budget />} />
                          <Route path="/predictions" element={<Predictions />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="/admin" element={<Admin />} />
                          <Route path="/preview" element={<Preview />} />
                          <Route path="/group" element={<Groups />} />
                          <Route path="/group/:groupId" element={<GroupDetail />} />
                          <Route path="/loans" element={<Loans />} />
                          <Route path="/subscriptions" element={<Subscriptions />} />
                          <Route path="/debts" element={<Debts />} />
                          <Route
                            path="/manualentry"
                            element={<DiaryTransactionInput />}
                          />
                        </Route>

                        {/* Default redirect */}
                        <Route
                          path="*"
                          element={<Navigate to="/" replace />}
                        />
                      </Routes>
                    </Suspense>
                  </PageHeaderProvider>
                </NotificationsProvider>
              </BudgetProvider>
            </CategoriesProvider>
          </TransactionsProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
