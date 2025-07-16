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
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Analytics from "./pages/Analytics";
import Budget from "./pages/Budget";
import Settings from "./pages/Settings";
import Predictions from "./pages/Predictions";
import Admin from "./pages/Admin";
import AuthCallback from "./pages/AuthCallback";
import Preview from "./pages/Preview";
import UpdatePassword from "./pages/UpdatePassword";
import Groups from "./pages/Group";
import GroupDetail from "./pages/GroupDetail";
import { Toaster } from "sonner";

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <AuthProvider>
        <TransactionsProvider>
          <CategoriesProvider>
            <BudgetProvider>
              <NotificationsProvider>
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/update-password" element={<UpdatePassword />} />

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
                  </Route>

                  {/* Default redirect */}
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </NotificationsProvider>
            </BudgetProvider>
          </CategoriesProvider>
        </TransactionsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
