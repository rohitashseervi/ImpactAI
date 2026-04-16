import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Activity, AlertCircle, Building2, HandHeart, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createNGOProfile, createVolunteerProfile } from '../lib/firestore';
import { NeedCategory, NGO, Volunteer } from '../types';

const CATEGORIES: NeedCategory[] = ['Medical', 'Water', 'Food', 'Shelter', 'Sanitation', 'Education'];
const SKILLS = ['Doctor', 'Nurse', 'Paramedic', 'Teacher', 'Engineer', 'Plumber', 'Driver', 'Cook', 'Construction', 'Sanitation Worker', 'Social Worker', 'Translator', 'Supply Chain', 'IT Support'];
const LANGUAGES = ['Hindi', 'English', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Odia', 'Urdu'];

export default function Register() {
  const { role } = useParams<{ role: string }>();
  const isNGO = role === 'ngo';
  const navigate = useNavigate();
  const { register } = useAuth();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const form = new FormData(e.target as HTMLFormElement);
    const email = form.get('email') as string;
    const password = form.get('password') as string;

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      if (isNGO) {
        const displayName = form.get('orgName') as string;
        const uid = await register(email, password, 'ngo', displayName);

        const ngoProfile: NGO = {
          ngoId: uid,
          orgName: displayName,
          location: { lat: 0, lng: 0 },
          locationText: form.get('locationText') as string,
          focusAreas: form.getAll('focusAreas') as NeedCategory[],
          contactPerson: form.get('contactPerson') as string,
          contactEmail: email,
          contactPhone: form.get('contactPhone') as string,
          createdAt: Date.now(),
        };
        await createNGOProfile(ngoProfile);
        navigate('/ngo', { replace: true });
      } else {
        const displayName = form.get('name') as string;
        const uid = await register(email, password, 'volunteer', displayName);

        const volunteerProfile: Volunteer = {
          volunteerId: uid,
          name: displayName,
          skills: form.getAll('skills') as string[],
          location: { lat: 0, lng: 0 },
          locationText: form.get('locationText') as string,
          availability: form.get('availability') as Volunteer['availability'],
          languages: form.getAll('languages') as string[],
          contactPhone: form.get('contactPhone') as string,
          contactEmail: email,
          experienceLevel: form.get('experienceLevel') as Volunteer['experienceLevel'],
          willingToTravel: form.get('willingToTravel') === 'yes',
          maxTravelKm: parseInt(form.get('maxTravelKm') as string) || 10,
          isActive: true,
          createdAt: Date.now(),
        };
        await createVolunteerProfile(volunteerProfile);
        navigate('/volunteer', { replace: true });
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else {
        setError(err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto"
      >
        <Link to="/" className="flex items-center gap-2 text-sm font-medium text-slate hover:text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 font-bold text-2xl text-primary mb-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Activity className="text-white w-5 h-5" />
            </div>
            ImpactAI
          </div>
          <div className="flex items-center justify-center gap-2 mt-3">
            {isNGO ? <Building2 className="w-5 h-5 text-primary" /> : <HandHeart className="w-5 h-5 text-success" />}
            <p className="text-lg font-semibold">Register as {isNGO ? 'NGO / Social Group' : 'Volunteer'}</p>
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-danger text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Common: Email & Password */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate block mb-1.5">Email</label>
                <input name="email" type="email" required className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate block mb-1.5">Password</label>
                <input name="password" type="password" required className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none" />
              </div>
            </div>

            {isNGO ? (
              <>
                <div>
                  <label className="text-xs font-bold uppercase text-slate block mb-1.5">Organization Name</label>
                  <input name="orgName" required className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate block mb-1.5">Location (City/District)</label>
                  <input name="locationText" required className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none" placeholder="e.g., Mumbai, Maharashtra" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate block mb-1.5">Contact Person</label>
                  <input name="contactPerson" required className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate block mb-1.5">Phone</label>
                  <input name="contactPhone" type="tel" required className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate block mb-1.5">Focus Areas</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <label key={cat} className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-sm cursor-pointer hover:bg-slate-50 has-[:checked]:bg-primary-soft has-[:checked]:border-primary/30">
                        <input type="checkbox" name="focusAreas" value={cat} className="accent-primary" />
                        {cat}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs font-bold uppercase text-slate block mb-1.5">Full Name</label>
                  <input name="name" required className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate block mb-1.5">Location (City/District)</label>
                  <input name="locationText" required className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none" placeholder="e.g., Delhi, NCR" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate block mb-1.5">Phone</label>
                  <input name="contactPhone" type="tel" required className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate block mb-1.5">Skills (select all that apply)</label>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS.map((skill) => (
                      <label key={skill} className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-sm cursor-pointer hover:bg-slate-50 has-[:checked]:bg-primary-soft has-[:checked]:border-primary/30">
                        <input type="checkbox" name="skills" value={skill} className="accent-primary" />
                        {skill}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate block mb-1.5">Availability</label>
                    <select name="availability" required className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none bg-white">
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="weekends">Weekends</option>
                      <option value="on-call">On-call</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate block mb-1.5">Experience</label>
                    <select name="experienceLevel" required className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none bg-white">
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="experienced">Experienced</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate block mb-1.5">Languages</label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((lang) => (
                      <label key={lang} className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-sm cursor-pointer hover:bg-slate-50 has-[:checked]:bg-primary-soft has-[:checked]:border-primary/30">
                        <input type="checkbox" name="languages" value={lang} className="accent-primary" />
                        {lang}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate block mb-1.5">Willing to Travel?</label>
                    <select name="willingToTravel" className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none bg-white">
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate block mb-1.5">Max Travel (km)</label>
                    <input name="maxTravelKm" type="number" defaultValue="50" min="1" max="500" className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
            {' | '}
            <Link to={isNGO ? '/register/volunteer' : '/register/ngo'} className="text-primary font-semibold hover:underline">
              Register as {isNGO ? 'Volunteer' : 'NGO'}
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
