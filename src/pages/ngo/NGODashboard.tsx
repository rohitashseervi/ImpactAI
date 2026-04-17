import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { FileText, Scan, ClipboardCheck, ArrowRight } from 'lucide-react';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';
import ReportForm from '../../components/Reports/ReportForm';
import OCRScanner from '../../components/Reports/OCRScanner';
import { useAuth } from '../../contexts/AuthContext';
import { useReports } from '../../hooks/useReports';
import { getNGOProfile } from '../../lib/firestore';
import { ExtractedReportData } from '../../lib/gemini';

function NGOOverview() {
  const { user } = useAuth();
  const { reports, loading } = useReports({ ngoId: user?.uid });
  const navigate = useNavigate();

  const pendingCount = reports.filter((r) => r.status === 'pending').length;
  const verifiedCount = reports.filter((r) => r.status !== 'pending').length;

  return (
    <>
      <Header title="NGO Dashboard" subtitle="Submit field reports and track community needs" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Reports', value: reports.length, color: 'text-primary' },
          { label: 'Pending Review', value: pendingCount, color: 'text-warning' },
          { label: 'Verified', value: verifiedCount, color: 'text-success' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-border rounded-xl p-5">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs font-semibold text-slate uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => navigate('/ngo/submit')}
          className="bg-white border border-border rounded-xl p-6 text-left hover:border-primary/30 hover:shadow-md transition-all group"
        >
          <FileText className="w-8 h-8 text-primary mb-3" />
          <h3 className="font-bold mb-1">Submit New Report</h3>
          <p className="text-xs text-slate">Fill in a field survey form manually</p>
          <ArrowRight className="w-4 h-4 text-primary mt-3 group-hover:translate-x-1 transition-transform" />
        </button>
        <button
          onClick={() => navigate('/ngo/ocr')}
          className="bg-white border border-border rounded-xl p-6 text-left hover:border-primary/30 hover:shadow-md transition-all group"
        >
          <Scan className="w-8 h-8 text-primary mb-3" />
          <h3 className="font-bold mb-1">Scan Paper Survey</h3>
          <p className="text-xs text-slate">Use AI to extract data from a photo</p>
          <ArrowRight className="w-4 h-4 text-primary mt-3 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Recent Reports */}
      <div className="bg-white border border-border rounded-xl p-5">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-primary" /> Recent Reports
        </h3>
        {loading ? (
          <p className="text-sm text-slate">Loading...</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-slate">No reports yet. Submit your first field report!</p>
        ) : (
          <div className="space-y-3">
            {reports.slice(0, 10).map((report) => (
              <div key={report.reportId} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <h4 className="text-sm font-semibold">{report.communityName}</h4>
                  <p className="text-xs text-slate">{report.needCategory} - {report.description.slice(0, 60)}...</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                    report.urgencyScore >= 8 ? 'bg-red-50 text-danger' : report.urgencyScore >= 5 ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-success'
                  }`}>
                    Score: {report.urgencyScore}
                  </span>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                    report.status === 'pending' ? 'bg-yellow-50 text-warning' : 'bg-green-50 text-success'
                  }`}>
                    {report.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function SubmitReport() {
  const { user } = useAuth();
  const [ngoName, setNgoName] = useState('');

  useEffect(() => {
    if (user) {
      getNGOProfile(user.uid).then((profile) => {
        if (profile) setNgoName(profile.orgName);
      });
    }
  }, [user]);

  return (
    <>
      <Header title="Submit Field Report" subtitle="Report community needs from your field survey" />
      <ReportForm ngoName={ngoName} />
    </>
  );
}

function ScanReport() {
  const { user } = useAuth();
  const [ngoName, setNgoName] = useState('');
  const [prefillData, setPrefillData] = useState<ExtractedReportData | null>(null);

  useEffect(() => {
    if (user) {
      getNGOProfile(user.uid).then((profile) => {
        if (profile) setNgoName(profile.orgName);
      });
    }
  }, [user]);

  if (prefillData) {
    return (
      <>
        <Header title="Review Extracted Data" subtitle="Review and correct the AI-extracted data before submitting" />
        <ReportForm ngoName={ngoName} prefillData={prefillData} />
      </>
    );
  }

  return (
    <>
      <Header title="OCR Scanner" subtitle="Scan a paper survey with AI Vision" />
      <div className="max-w-xl mx-auto">
        <OCRScanner onExtracted={setPrefillData} />
      </div>
    </>
  );
}

function MyReports() {
  const { user } = useAuth();
  const { reports, loading } = useReports({ ngoId: user?.uid });

  return (
    <>
      <Header title="My Reports" subtitle="All field reports submitted by your organization" />
      <div className="bg-white border border-border rounded-xl p-5">
        {loading ? (
          <p className="text-sm text-slate">Loading...</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-slate">No reports submitted yet.</p>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.reportId} className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{report.communityName}</h4>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                      report.urgencyScore >= 8 ? 'bg-red-50 text-danger' : report.urgencyScore >= 5 ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-success'
                    }`}>
                      Urgency: {report.urgencyScore}
                    </span>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      report.status === 'pending' ? 'bg-yellow-50 text-warning' : 'bg-green-50 text-success'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate mb-1">{report.needCategory} - {report.description}</p>
                <p className="text-xs text-slate">
                  {report.peopleAffected} people affected | Surveyed: {report.dateOfSurvey} | By: {report.fieldWorkerName}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function NGODashboard() {
  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <Routes>
          <Route index element={<NGOOverview />} />
          <Route path="submit" element={<SubmitReport />} />
          <Route path="ocr" element={<ScanReport />} />
          <Route path="reports" element={<MyReports />} />
        </Routes>
      </main>
    </div>
  );
}
