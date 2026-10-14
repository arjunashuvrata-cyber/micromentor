import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InputField from './components/InputField';
import Button from './components/Button';
import FormSection from './components/FormSection';
import { api } from './api/client';
import './MenteeProfileAndGoalsScreen.css';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const MenteeProfileAndGoalsScreen = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [learningGoal, setLearningGoal] = useState('');
  const [experienceLevel, setExperienceLevel] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load any saved profile from Supabase (via the API) so it survives refreshes.
  useEffect(() => {
    let cancelled = false;
    api.getProfile()
      .then(({ profile }) => {
        if (cancelled || !profile) return;
        setName(profile.name);
        setLearningGoal(profile.learning_goal);
        setExperienceLevel(profile.experience_level);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setIsLoading(false));
    return () => { cancelled = true; };
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim() || !learningGoal.trim() || !experienceLevel) {
      setError('Please fill in all fields.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await api.saveProfile({
        name,
        learning_goal: learningGoal,
        experience_level: experienceLevel,
      });
      navigate('/browse-mentors');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mentee-profile-container">
      <h1 className="mentee-profile-header">Mentee Profile & Goals</h1>
      <form onSubmit={handleSaveProfile} style={{ width: '100%', maxWidth: 560 }}>
        <FormSection
          title="Your Profile"
          description={isLoading ? 'Loading your saved profile...' : 'Mentors see this before your session.'}
        >
          <InputField
            label="Name"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <InputField
            label="Learning Goal"
            type="textarea"
            placeholder="E.g., Master React, Learn Python"
            value={learningGoal}
            onChange={(e) => setLearningGoal(e.target.value)}
            required
          />
          <div className="experience-level-control">
            <label className="input-field-label">Experience Level</label>
            <div className="segmented-control">
              {LEVELS.map((level) => (
                <Button
                  key={level}
                  label={level}
                  onClick={() => setExperienceLevel(level)}
                  variant={experienceLevel === level ? 'primary' : 'secondary'}
                />
              ))}
            </div>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <Button
            type="submit"
            label={isSubmitting ? 'Saving...' : 'Save Profile & Continue'}
            variant="primary"
            fullWidth
            disabled={isSubmitting || isLoading}
          />
        </FormSection>
      </form>
    </div>
  );
};

export default MenteeProfileAndGoalsScreen;
