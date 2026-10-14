import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './components/Button';
import { api } from './api/client';
import './BrowseMentorsScreen.css';

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
};

const MyBookingsScreen = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.getBookings()
      .then(({ bookings: list }) => !cancelled && setBookings(list))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setIsLoading(false));
    return () => { cancelled = true; };
  }, []);

  const handleCancel = async (id) => {
    setCancellingId(id);
    setError('');
    try {
      await api.cancelBooking(id);
      setBookings((list) => list.filter((b) => b.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="browse-mentors-container">
      <h1 className="browse-mentors-header">My Bookings</h1>
      {isLoading && <p className="status-text">Loading your bookings...</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {!isLoading && bookings.length === 0 && !error && (
        <div className="card empty-state">
          <p>You haven't booked any sessions yet.</p>
          <Button label="Browse Mentors" variant="primary" onClick={() => navigate('/browse-mentors')} />
        </div>
      )}
      <div className="mentors-list">
        {bookings.map((b) => (
          <div key={b.id} className="mentor-card card">
            <div>
              <h2 className="mentor-name">{b.mentor_name}</h2>
              <p className="mentor-title">{b.mentor_title}</p>
              <p className="booking-slot">{b.slot}</p>
              <p className="mentor-availability">
                Status: <strong>{b.status}</strong> · Booked {formatDate(b.created_at)}
              </p>
            </div>
            <Button
              label={cancellingId === b.id ? 'Cancelling...' : 'Cancel Booking'}
              variant="danger"
              fullWidth
              disabled={cancellingId === b.id}
              onClick={() => handleCancel(b.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyBookingsScreen;
