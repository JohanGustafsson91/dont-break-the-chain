import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { StreakTracker } from "../StreakTracker/StreakTracker";
import { ProtectedRoute } from "../ProtectedRoute/ProtectedRoute";
import { Login } from "../Login/Login";
import { HabitsList } from "../HabitsList/HabitsList";
import { AppBarProvider } from "../AppBar/AppBar.Provider";
import { initializeNotifications } from "../../services/notificationService";
import { useAuth } from "../../services/authService";

export const App = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const hasPermission =
      "Notification" in window &&
      (Notification.permission === "granted" || Notification.permission === "denied");

    if (hasPermission) {
      initializeNotifications();
      return;
    }

    // Delay notification permission request by 2 seconds after login
    // to avoid interrupting the user immediately after authentication
    const timer = setTimeout(() => initializeNotifications(), 2000);
    return () => clearTimeout(timer);
  }, [user]);

  return (
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
            path="/habits/:id"
            element={
              <ProtectedRoute>
                <StreakTracker />
              </ProtectedRoute>
            }
          />
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
  );
};
