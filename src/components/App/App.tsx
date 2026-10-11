import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { StreakTracker } from "../StreakTracker/StreakTracker";
import { ProtectedRoute } from "../ProtectedRoute/ProtectedRoute";
import { Login } from "../Login/Login";
import { HabitsList } from "../HabitsList/HabitsList";
import { Overview } from "../Overview/Overview";
import { AppBarProvider } from "../AppBar/AppBar.Provider";
import { PrivacyPolicy } from "../Legal/PrivacyPolicy";
import { Terms } from "../Legal/Terms";
import { ErrorBoundary } from "../ErrorBoundary/ErrorBoundary";
import { ToastProvider } from "../Toast/Toast.Provider";

export const App = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppBarProvider>
          <Router>
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <HabitsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/overview"
                element={
                  <ProtectedRoute>
                    <Overview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/habits/:id"
                element={
                  <ProtectedRoute>
                    <StreakTracker />
                  </ProtectedRoute>
                }
              />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<Terms />} />
              <Route
                path="/login"
                element={
                  <ProtectedRoute isLoginPage>
                    <Login />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </AppBarProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};
