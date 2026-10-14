import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import LoginScreen from './LoginScreen';
import MenteeProfileAndGoalsScreen from './MenteeProfileAndGoalsScreen';
import BrowseMentorsScreen from './BrowseMentorsScreen';
import MentoringScreen from './MentoringScreen';
import BookingConfirmationScreen from './BookingConfirmationScreen';
import MyBookingsScreen from './MyBookingsScreen';
import { useAppContext } from './context/AppContext';
import './App.css';

/** Sends logged-out visitors back to the login screen. */
const RequireAuth = ({ children }) => {
  const { user } = useAppContext();
  return user ? children : <Navigate to="/" replace />;
};

const Navigation = () => {
  const { user, signOut } = useAppContext();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <nav className="app-navigation">
      <NavLink to="/mentee-profile" className="nav-link">Profile</NavLink>
      <NavLink to="/browse-mentors" className="nav-link">Mentors</NavLink>
      <NavLink to="/my-bookings" className="nav-link">My Bookings</NavLink>
      <span className="nav-user">{user.email}</span>
      <button
        type="button"
        className="nav-link nav-logout"
        onClick={() => { signOut(); navigate('/'); }}
      >
        Log out
      </button>
    </nav>
  );
};

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <Navigation />
        <Routes>
          <Route path="/" element={<LoginScreen />} />
          <Route path="/mentee-profile" element={<RequireAuth><MenteeProfileAndGoalsScreen /></RequireAuth>} />
          <Route path="/browse-mentors" element={<RequireAuth><BrowseMentorsScreen /></RequireAuth>} />
          <Route path="/mentor/:mentorId" element={<RequireAuth><MentoringScreen /></RequireAuth>} />
          <Route path="/booking-confirmation" element={<RequireAuth><BookingConfirmationScreen /></RequireAuth>} />
          <Route path="/my-bookings" element={<RequireAuth><MyBookingsScreen /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
