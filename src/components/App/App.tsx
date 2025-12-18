import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { StreakTracker } from "../StreakTracker/StreakTracker";
import { ProtectedRoute } from "../ProtectedRoute/ProtectedRoute";
import { Login } from "../Login/Login";
import { HabitsList } from "../HabitsList/HabitsList";
import { AppBarProvider } from "../AppBar/AppBar.Provider";
import { initializeNotifications } from "../../services/notificationService";
import { DebugNotificationButton } from "../DebugNotificationButton/DebugNotificationButton";

export const App = () => {
  useEffect(() => {
    // Initialize notifications after a short delay to not interrupt initial load
    const timer = setTimeout(() => {
      initializeNotifications();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

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
      <DebugNotificationButton />
    </AppBarProvider>
  );
};
