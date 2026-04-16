import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Users, FileText, Brain } from 'lucide-react';
import { getCommunity } from '../../lib/firestore';
import { useReports } from '../../hooks/useReports';
import { generateCommunityInsights } from '../../lib/gemini';
import { Community } from '../../types';

export default function CommunityDetail() {
  const { communityId } = useParams<{ communityId: string }>();
  const navigate = useNavigate();
  const [community, setCommunity] = useState<Community | null>(null);
  const [insights, setInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const { reports, loading } = useReports({ communityId });

  useEffect(() => {
    if (communityId) {
      getCommunity(communityId).then(setCommunity);
    }
  }, [communityId]);

  useEffect(() => {
    if (reports.length > 0 && community) {
      setLoadingInsights(true);
      generateCommunityInsights(
        community.name,
        reports.map((r) => ({
          category: r.needCategory,
          description: r.description,
          urgencyScore: r.urgencyScore,
          peopleAffected: r.peopleAffected,
        }))
      ).then((result) => {
        setInsights(result);
        setLoadingInsights(false);
      });
    }
  }, [reports, community]);

  if (!community) {
    return <div className="p-6"><p className="text-sm text-slate">Loading community...</p></div>;
  }

  const totalAffected = reports.reduce((acc, r) => acc + r.peopleAffected, 0);
  const avgUrgency = reports.length > 0 ? (reports.reduce((acc, r) => acc + r.urgencyScore, 0) / reports.length).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-bg p-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-slate hover:text-primary mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Community Header */}
      <div className="bg-white border border-border rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" />
              {community.name}
            </h1>
            <p className="text-sm text-slate mt-1">{community.district}, {community.state} — {community.pinCode}</p>
          </div>
          <div className="flex gap-3">
            <div className="text-center px-4 py-2 bg-slate-50 rounded-lg">
              <div className="text-lg font-bold text-primary">{reports.length}</div>
              <div className="text-[10px] text-slate uppercase font-semibold">Reports</div>
            </div>
            <div className="text-center px-4 py-2 bg-slate-50 rounded-lg">
              <div className="text-lg font-bold text-danger">{avgUrgency}</div>
              <div className="text-[10px] text-slate uppercase font-semibold">Avg Urgency</div>
            </div>
            <div className="text-center px-4 py-2 bg-slate-50 rounded-lg">
              <div className="text-lg font-bold text-warning">{totalAffected}</div>
              <div className="text-[10px] text-slate uppercase font-semibold">People Affected</div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <span className="px-3 py-1 bg-primary-soft text-primary text-xs font-bold rounded-lg">{community.areaType}</span>
          <span className="px-3 py-1 bg-slate-100 text-slate text-xs font-bold rounded-lg">Pop: ~{community.populationApprox}</span>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-br from-primary to-blue-800 text-white rounded-xl p-6 mb-6">
        <h3 className="font-bold flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5" /> AI Community Insights
        </h3>
        {loadingInsights ? (
          <div className="flex items-center gap-2 text-sm opacity-80">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating insights...
          </div>
        ) : (
          <p className="text-sm leading-relaxed opacity-90">{insights || 'No insights available yet.'}</p>
        )}
      </div>

      {/* Reports */}
      <div className="bg-white border border-border rounded-xl p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Field Reports ({reports.length})
        </h3>
        {loading ? (
          <p className="text-sm text-slate">Loading...</p>
        ) : (
          <div className="space-y-3">
            {reports.sort((a, b) => b.urgencyScore - a.urgencyScore).map((report) => (
              <div key={report.reportId} className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                      report.urgencyScore >= 8 ? 'bg-red-50 text-danger' : report.urgencyScore >= 5 ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-success'
                    }`}>
                      {report.urgencyScore}/10
                    </span>
                    <span className="px-2 py-1 bg-slate-100 text-slate text-[10px] font-bold rounded">{report.needCategory}</span>
                  </div>
                  <span className="text-[10px] text-slate">{report.dateOfSurvey}</span>
                </div>
                <p className="text-sm mb-2">{report.description}</p>
                <p className="text-xs text-slate">
                  By: {report.ngoName} ({report.fieldWorkerName}) | {report.peopleAffected} people affected | Source: {report.sourceType}
                </p>
                {report.currentResources && (
                  <p className="text-xs text-slate mt-1">Current resources: {report.currentResources}</p>
                )}
              </div>
            ))}
            {reports.length === 0 && <p className="text-sm text-slate">No reports for this community yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
