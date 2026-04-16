import { useState } from 'react';
import { useReports } from '../../hooks/useReports';
import { FileText } from 'lucide-react';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';

export default function AdminReports() {
  const { reports, loading } = useReports();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? reports : reports.filter((r) => r.needCategory === filter);

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <Header title="All Reports" subtitle="Field reports from all NGOs" />
        <div className="flex gap-2 mb-4 flex-wrap">
          {['all', 'Medical', 'Water', 'Food', 'Shelter', 'Sanitation', 'Education'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filter === f ? 'bg-primary text-white' : 'bg-white border border-border text-slate hover:bg-slate-50'
              }`}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
        {loading ? (
          <p className="text-sm text-slate">Loading...</p>
        ) : (
          <div className="space-y-3">
            {filtered.sort((a, b) => b.urgencyScore - a.urgencyScore).map((report) => (
              <div key={report.reportId} className="bg-white border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-bold">{report.communityName}</h3>
                    <p className="text-sm text-slate">{report.needCategory} — {report.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    report.urgencyScore >= 8 ? 'bg-red-50 text-danger' : report.urgencyScore >= 5 ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-success'
                  }`}>
                    {report.urgencyScore}/10
                  </span>
                </div>
                <p className="text-xs text-slate">
                  by {report.ngoName} ({report.fieldWorkerName}) | {report.peopleAffected} affected | {report.dateOfSurvey}
                </p>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-sm text-slate">No reports found.</p>}
          </div>
        )}
      </main>
    </div>
  );
}
