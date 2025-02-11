import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import { StreakTracker } from "./components/StreakTracker/StreakTracker";
import { ProtectedRoute } from "./components/ProtectedRoute/ProtectedRoute";
import { Login } from "./components/Login/Login";
import { Habits } from "./components/Habits/Habits";

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Habits />
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
  );
}

export default App;
