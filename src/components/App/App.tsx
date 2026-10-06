import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { StreakTracker } from "../StreakTracker/StreakTracker";
import { ProtectedRoute } from "../ProtectedRoute/ProtectedRoute";
import { Login } from "../Login/Login";
import { HabitsList } from "../HabitsList/HabitsList";
import { AppBarProvider } from "../AppBar/AppBar.Provider";
import { PrivacyPolicy } from "../Legal/PrivacyPolicy";
import { Terms } from "../Legal/Terms";

export const App = () => {
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
  );
};
