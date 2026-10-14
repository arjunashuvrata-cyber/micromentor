import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from './components/Button';
import Badge from './components/Badge';
import FormSection from './components/FormSection';
import { api } from './api/client';
import './MentoringScreen.css';

const MentoringScreen = () => {
  const { mentorId } = useParams();
  const navigate = useNavigate();
  const [mentor, setMentor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  const loadMentor = useCallback(() => {
    setIsLoading(true);
    return api.getMentor(mentorId)
      .then(({ mentor: m }) => setMentor(m))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [mentorId]);

  useEffect(() => { loadMentor(); }, [loadMentor]);

  const handleBookSession = async () => {
    if (!selectedSlot) {
      setError('Please select a time slot.');
      return;
    }
    setIsBooking(true);
    setError('');
    try {
      const { booking } = await api.createBooking(mentor.id, selectedSlot);
      navigate('/booking-confirmation', {
        state: { success: true, mentorName: mentor.name, mentorId: mentor.id, time: booking.slot },
      });
    } catch (err) {
      if (err.status === 409) {
        // Slot was taken by someone else: show the failure screen with a retry.
        navigate('/booking-confirmation', {
          state: { success: false, mentorName: mentor.name, mentorId: mentor.id, time: selectedSlot, message: err.message },
        });
      } else {
        setError(err.message);
      }
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading && !mentor) {
    return <div className="mentoring-container"><p className="status-text">Loading mentor...</p></div>;
  }

  if (!mentor) {
    return (
      <div className="mentoring-container">
        <p className="form-error">{error || 'Mentor not found.'}</p>
        <Button label="Back to Mentors" variant="secondary" onClick={() => navigate('/browse-mentors')} />
      </div>
    );
  }

  return (
    <div className="mentoring-container">
      <h1 className="mentoring-header">Mentor Profile</h1>
      <div style={{ width: '100%', maxWidth: 600 }}>
        <FormSection title={mentor.name} description={mentor.title}>
          <div className="mentor-tags">
            {mentor.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
          </div>
          <p className="mentor-info">{mentor.bio}</p>

          <h3 className="section-header">Choose a 15-minute slot</h3>
          <div className="slot-grid">
            {mentor.slots.map((slot) => (
              <button
                key={slot.time}
                type="button"
                disabled={!slot.available || isBooking}
                className={`slot-button${selectedSlot === slot.time ? ' selected' : ''}`}
                onClick={() => setSelectedSlot(slot.time)}
              >
                {slot.time}
                {!slot.available && <span className="slot-taken">Booked</span>}
              </button>
            ))}
          </div>

          <p className="selected-slot">
            {selectedSlot ? `Selected: ${selectedSlot}` : 'No slot selected yet'}
          </p>

          {error && <p className="form-error" role="alert">{error}</p>}

          <div className="mentor-actions">
            <Button
              label={isBooking ? 'Booking...' : 'Book Session'}
              onClick={handleBookSession}
              variant="primary"
              disabled={isBooking || !selectedSlot}
            />
            <Button
              label="Back to Mentors"
              onClick={() => navigate('/browse-mentors')}
              variant="secondary"
              disabled={isBooking}
            />
          </div>
        </FormSection>
      </div>
    </div>
  );
};

export default MentoringScreen;
