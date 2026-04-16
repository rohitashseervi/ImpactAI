import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getNGOProfile, getVolunteerProfile, updateVolunteerProfile } from '../lib/firestore';
import { NGO, Volunteer } from '../types';
import { updateDoc, doc } from 'firebase/firestore';
import { firestore } from '../config/firebase';

export default function Profile() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [ngoData, setNgoData] = useState<NGO | null>(null);
  const [volunteerData, setVolunteerData] = useState<Volunteer | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!userProfile) return;
    if (userProfile.role === 'ngo') {
      getNGOProfile(userProfile.uid).then(setNgoData);
    } else if (userProfile.role === 'volunteer') {
      getVolunteerProfile(userProfile.uid).then(setVolunteerData);
    }
  }, [userProfile]);

  const handleSaveVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!volunteerData) return;
    setSaving(true);
    try {
      const form = new FormData(e.target as HTMLFormElement);
      await updateVolunteerProfile(volunteerData.volunteerId, {
        locationText: form.get('locationText') as string,
        availability: form.get('availability') as Volunteer['availability'],
        willingToTravel: form.get('willingToTravel') === 'yes',
        maxTravelKm: parseInt(form.get('maxTravelKm') as string) || 10,
        isActive: form.get('isActive') === 'yes',
      });
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNGO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ngoData) return;
    setSaving(true);
    try {
      const form = new FormData(e.target as HTMLFormElement);
      await updateDoc(doc(firestore, 'ngos', ngoData.ngoId), {
        locationText: form.get('locationText') as string,
        contactPerson: form.get('contactPerson') as string,
        contactPhone: form.get('contactPhone') as string,
      });
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg p-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-slate hover:text-primary mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="max-w-xl mx-auto">
        <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary-soft rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{userProfile?.displayName}</h1>
              <p className="text-sm text-slate capitalize">{userProfile?.role} | {userProfile?.email}</p>
            </div>
          </div>

          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-100 text-success text-sm rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {message}
            </div>
          )}

          {userProfile?.role === 'volunteer' && volunteerData && (
            <form onSubmit={handleSaveVolunteer} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate block mb-1.5">Location</label>
                <input name="locationText" defaultValue={volunteerData.locationText} className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate block mb-1.5">Availability</label>
                  <select name="availability" defaultValue={volunteerData.availability} className="w-full px-4 py-3 rounded-xl border border-border outline-none bg-white">
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="weekends">Weekends</option>
                    <option value="on-call">On-call</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate block mb-1.5">Active Status</label>
                  <select name="isActive" defaultValue={volunteerData.isActive ? 'yes' : 'no'} className="w-full px-4 py-3 rounded-xl border border-border outline-none bg-white">
                    <option value="yes">Active</option>
                    <option value="no">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate block mb-1.5">Willing to Travel?</label>
                  <select name="willingToTravel" defaultValue={volunteerData.willingToTravel ? 'yes' : 'no'} className="w-full px-4 py-3 rounded-xl border border-border outline-none bg-white">
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate block mb-1.5">Max Travel (km)</label>
                  <input name="maxTravelKm" type="number" defaultValue={volunteerData.maxTravelKm} className="w-full px-4 py-3 rounded-xl border border-border outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate block mb-1.5">Skills</label>
                <div className="flex flex-wrap gap-1.5">
                  {volunteerData.skills.map((s) => (
                    <span key={s} className="px-2 py-1 bg-primary-soft text-primary text-xs font-bold rounded">{s}</span>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Update Profile'}
              </button>
            </form>
          )}

          {userProfile?.role === 'ngo' && ngoData && (
            <form onSubmit={handleSaveNGO} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate block mb-1.5">Organization Name</label>
                <input disabled value={ngoData.orgName} className="w-full px-4 py-3 rounded-xl border border-border bg-slate-50 text-slate" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate block mb-1.5">Location</label>
                <input name="locationText" defaultValue={ngoData.locationText} className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate block mb-1.5">Contact Person</label>
                <input name="contactPerson" defaultValue={ngoData.contactPerson} className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate block mb-1.5">Phone</label>
                <input name="contactPhone" defaultValue={ngoData.contactPhone} className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate block mb-1.5">Focus Areas</label>
                <div className="flex flex-wrap gap-1.5">
                  {ngoData.focusAreas.map((a) => (
                    <span key={a} className="px-2 py-1 bg-primary-soft text-primary text-xs font-bold rounded">{a}</span>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Update Profile'}
              </button>
            </form>
          )}

          {userProfile?.role === 'admin' && (
            <div className="text-center text-sm text-slate py-8">
              Admin profile management is handled through Firebase Console.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
