import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Button from './components/Button';
import './BookingConfirmationScreen.css';

const BookingConfirmationScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;

  // Opened directly (e.g. after a refresh) - nothing to confirm.
  if (!state) return <Navigate to="/my-bookings" replace />;

  const { mentorName, mentorId, time, success, message } = state;

  return (
    <div className={`booking-confirmation-container${success ? '' : ' failed'}`}>
      <h1 className="booking-confirmation-header">
        {success ? 'Booking Confirmed!' : 'Booking Failed'}
      </h1>
      <p className="booking-confirmation-message">
        {success
          ? <>Your 15-minute session with <span className="highlight">{mentorName}</span> has been booked and saved.</>
          : <>Your session with <span className="highlight">{mentorName}</span> could not be booked.</>}
      </p>
      {time && (
        <p className="booking-confirmation-details">
          Time: <span className="highlight">{time}</span>
        </p>
      )}
      {!success && (
        <p className="booking-confirmation-footer" style={{ color: '#c53030' }}>
          {message || 'The slot is no longer available. Please choose another time.'}
        </p>
      )}
      <div className="mentor-actions">
        {success ? (
          <>
            <Button label="View My Bookings" variant="primary" onClick={() => navigate('/my-bookings')} />
            <Button label="Browse More Mentors" variant="secondary" onClick={() => navigate('/browse-mentors')} />
          </>
        ) : (
          <>
            <Button label="Try Another Slot" variant="danger" onClick={() => navigate(`/mentor/${mentorId}`)} />
            <Button label="Back to Mentors" variant="secondary" onClick={() => navigate('/browse-mentors')} />
          </>
        )}
      </div>
    </div>
  );
};

export default BookingConfirmationScreen;
