import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.css";
import { StreakTracker } from "./components/StreakTracker/StreakTracker";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/activity/:id" element={<StreakTracker />} />
      </Routes>
    </Router>
  );
}

const Home = () => {
  return (
    <div className="page">
      <h1>Activities</h1>
      <Link to="/activity/id">Activity</Link>
    </div>
  );
};

export default App;
