import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { StreakTracker } from "./components/StreakTracker/StreakTracker";
import { ProtectedRoute } from "./components/ProtectedRoute/ProtectedRoute";
import { Login } from "./components/Login/Login";
import { HabitsList } from "./components/Habits/HabitsList";
import { AppBarProvider } from "./components/AppBar/AppBar.Provider";

export const App = () => (
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
            <ProtectedRoute fromLogin>
              <Login />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  </AppBarProvider>
);
