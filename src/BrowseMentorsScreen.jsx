import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './components/Button';
import Badge from './components/Badge';
import { api } from './api/client';
import './BrowseMentorsScreen.css';

const BrowseMentorsScreen = () => {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.getMentors()
      .then(({ mentors: list }) => !cancelled && setMentors(list))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setIsLoading(false));
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="browse-mentors-container">
      <h1 className="browse-mentors-header">Browse Mentors</h1>
      {isLoading && <p className="status-text">Loading mentors...</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="mentors-list">
        {mentors.map((mentor) => {
          const open = mentor.slots.filter((s) => s.available).length;
          return (
            <div key={mentor.id} className="mentor-card card">
              <div>
                <h2 className="mentor-name">{mentor.name}</h2>
                <p className="mentor-title">{mentor.title}</p>
                <div className="mentor-tags">
                  {mentor.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
                <p className="mentor-bio">{mentor.bio}</p>
                <p className="mentor-availability">
                  {open > 0 ? `${open} of ${mentor.slots.length} slots open` : 'Fully booked'}
                </p>
              </div>
              <Button
                label="View Profile & Book"
                onClick={() => navigate(`/mentor/${mentor.id}`)}
                variant="primary"
                fullWidth
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BrowseMentorsScreen;
