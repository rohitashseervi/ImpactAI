import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createCommunity, createReport, findCommunityByNameAndPin } from '../../lib/firestore';
import { calculateUrgencyScore } from '../../lib/gemini';
import { NeedCategory, FieldReport } from '../../types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { firestore } from '../../config/firebase';

const CATEGORIES: NeedCategory[] = ['Medical', 'Water', 'Food', 'Shelter', 'Sanitation', 'Education'];

interface Props {
  ngoName: string;
  prefillData?: any;
  onSuccess?: () => void;
}

export default function ReportForm({ ngoName, prefillData, onSuccess }: Props) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError('');

    const form = new FormData(e.target as HTMLFormElement);
    const communityName = form.get('communityName') as string;
    const pinCode = form.get('pinCode') as string;

    try {
      // Find or create community
      let community = await findCommunityByNameAndPin(communityName, pinCode);
      let communityId: string;

      if (community) {
        communityId = community.communityId;
      } else {
        communityId = await createCommunity({
          name: communityName,
          location: { lat: 0, lng: 0 },
          locationText: `${form.get('district')}, ${form.get('state')}`,
          district: form.get('district') as string,
          state: form.get('state') as string,
          pinCode,
          populationApprox: parseInt(form.get('population') as string) || 0,
          areaType: form.get('areaType') as any || 'rural',
        });
      }

      const description = form.get('description') as string;
      const manualUrgency = parseInt(form.get('manualUrgency') as string);

      // Create report with manual urgency first
      const reportData: Omit<FieldReport, 'reportId' | 'createdAt'> = {
        communityId,
        communityName,
        ngoId: user.uid,
        ngoName,
        fieldWorkerName: form.get('fieldWorkerName') as string,
        needCategory: form.get('needCategory') as NeedCategory,
        description,
        peopleAffected: parseInt(form.get('peopleAffected') as string) || 0,
        currentResources: form.get('currentResources') as string,
        urgencyScore: manualUrgency,
        manualUrgency,
        sourceType: prefillData ? 'ocr' : 'manual',
        dateOfSurvey: form.get('dateOfSurvey') as string,
        status: 'pending',
      };

      const reportId = await createReport(reportData);

      // AI urgency scoring in background
      calculateUrgencyScore(description).then(async (aiResult) => {
        try {
          await updateDoc(doc(firestore, 'reports', reportId), {
            urgencyScore: aiResult.score,
          });
        } catch (err) {
          console.error('Failed to update AI urgency:', err);
        }
      });

      setSuccess(true);
      (e.target as HTMLFormElement).reset();
      onSuccess?.();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
      <h2 className="text-xl font-bold mb-1">Submit Field Report</h2>
      <p className="text-sm text-slate mb-6">Report community needs from your field survey</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-danger text-sm rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-100 text-success text-sm rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Report submitted successfully! AI is analyzing urgency in the background.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Community Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase text-slate block mb-1.5">Community / Village Name</label>
            <input name="communityName" required defaultValue={prefillData?.communityName || ''} className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-slate block mb-1.5">PIN Code</label>
            <input name="pinCode" required className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none" placeholder="6-digit PIN" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold uppercase text-slate block mb-1.5">District</label>
            <input name="district" required defaultValue={prefillData?.location || ''} className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-slate block mb-1.5">State</label>
            <input name="state" required className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-slate block mb-1.5">Area Type</label>
            <select name="areaType" className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none bg-white">
              <option value="rural">Rural</option>
              <option value="urban">Urban</option>
              <option value="tribal">Tribal</option>
              <option value="camp">Camp</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase text-slate block mb-1.5">Population (approx)</label>
            <input name="population" type="number" className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-slate block mb-1.5">Field Worker Name</label>
            <input name="fieldWorkerName" required defaultValue={prefillData?.fieldWorkerName || ''} className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none" />
          </div>
        </div>

        {/* Need Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase text-slate block mb-1.5">Need Category</label>
            <select name="needCategory" required defaultValue={prefillData?.needCategory || 'Medical'} className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none bg-white">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-slate block mb-1.5">Manual Urgency (1-10)</label>
            <select name="manualUrgency" required className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none bg-white">
              {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n} - {n >= 8 ? 'Critical' : n >= 5 ? 'Moderate' : 'Low'}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase text-slate block mb-1.5">Description of Need</label>
          <textarea name="description" required rows={3} defaultValue={prefillData?.description || ''} className="w-full p-4 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none resize-none" placeholder="Describe the situation in detail..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase text-slate block mb-1.5">People Affected</label>
            <input name="peopleAffected" type="number" required defaultValue={prefillData?.peopleAffected || ''} className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-slate block mb-1.5">Date of Survey</label>
            <input name="dateOfSurvey" type="date" required defaultValue={prefillData?.dateOfSurvey || ''} className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none" />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase text-slate block mb-1.5">Current Resources Available</label>
          <textarea name="currentResources" rows={2} defaultValue={prefillData?.currentResources || ''} className="w-full p-4 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none resize-none" placeholder="What help is already available in this area?" />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
        <p className="text-[10px] text-center text-slate">AI will analyze urgency in the background after submission.</p>
      </form>
    </div>
  );
}
