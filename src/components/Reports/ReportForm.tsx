import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { createCommunity, createReport, findCommunityByNameAndPin } from '../../lib/firestore';
import { calculateUrgencyScore } from '../../lib/gemini';
import { NeedCategory, FieldReport } from '../../types';
import { AlertCircle, CheckCircle2, Sparkles, ArrowRight, Plus } from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { firestore } from '../../config/firebase';

interface SubmittedReportInfo {
  communityName: string;
  needCategory: NeedCategory;
  manualUrgency: number;
  aiUrgency: number | null;
  peopleAffected: number;
}

const CATEGORIES: NeedCategory[] = ['Medical', 'Water', 'Food', 'Shelter', 'Sanitation', 'Education'];

interface Props {
  ngoName: string;
  prefillData?: any;
  onSuccess?: () => void;
}

export default function ReportForm({ ngoName, prefillData, onSuccess }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedInfo, setSubmittedInfo] = useState<SubmittedReportInfo | null>(null);

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

      // Show modal immediately with manual urgency; AI score populates when ready
      setSubmittedInfo({
        communityName,
        needCategory: reportData.needCategory,
        manualUrgency,
        aiUrgency: null,
        peopleAffected: reportData.peopleAffected,
      });

      // AI urgency scoring in background
      calculateUrgencyScore(description).then(async (aiResult) => {
        try {
          await updateDoc(doc(firestore, 'reports', reportId), {
            urgencyScore: aiResult.score,
          });
          setSubmittedInfo((prev) => prev ? { ...prev, aiUrgency: aiResult.score } : prev);
        } catch (err) {
          console.error('Failed to update AI urgency:', err);
        }
      });

      (e.target as HTMLFormElement).reset();
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const displayedUrgency = submittedInfo?.aiUrgency ?? submittedInfo?.manualUrgency ?? 0;
  const urgencyColor =
    displayedUrgency >= 8 ? 'text-danger' : displayedUrgency >= 5 ? 'text-warning' : 'text-success';
  const urgencyLabel =
    displayedUrgency >= 8 ? 'Critical' : displayedUrgency >= 5 ? 'Moderate' : 'Low';

  return (
    <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
      <h2 className="text-xl font-bold mb-1">Submit Field Report</h2>
      <p className="text-sm text-slate mb-6">Report community needs from your field survey</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-danger text-sm rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <AnimatePresence>
        {submittedInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4"
            onClick={() => setSubmittedInfo(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 className="w-12 h-12 text-success" strokeWidth={2.5} />
              </motion.div>

              <h3 className="text-2xl font-bold text-center mb-1">Report Submitted!</h3>
              <p className="text-sm text-slate text-center mb-6">
                Thank you for speaking up for the community.
              </p>

              <div className="space-y-3 bg-slate-50 rounded-2xl p-4 mb-5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-slate">Community</span>
                  <span className="text-sm font-semibold">{submittedInfo.communityName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-slate">Category</span>
                  <span className="text-sm font-semibold">{submittedInfo.needCategory}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-slate">People Affected</span>
                  <span className="text-sm font-semibold">{submittedInfo.peopleAffected.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <span className="text-xs font-bold uppercase text-slate flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-primary" /> AI Urgency
                  </span>
                  {submittedInfo.aiUrgency === null ? (
                    <span className="text-xs text-slate flex items-center gap-1.5">
                      <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      Gemini analyzing…
                    </span>
                  ) : (
                    <span className={`text-lg font-bold ${urgencyColor}`}>
                      {displayedUrgency}/10 · {urgencyLabel}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSubmittedInfo(null)}
                  className="py-3 border border-border rounded-xl font-semibold text-sm hover:bg-slate-50 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Submit Another
                </button>
                <button
                  onClick={() => { setSubmittedInfo(null); navigate('/ngo/reports'); }}
                  className="py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-blue-700 flex items-center justify-center gap-1.5"
                >
                  View My Reports <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
