import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  MapPin,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ListTodo,
  Brain,
  Activity,
  ArrowRight,
} from 'lucide-react';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';
import CommunityMap from '../../components/Map/CommunityMap';
import { useCommunities } from '../../hooks/useCommunities';
import { useReports } from '../../hooks/useReports';
import { useVolunteers } from '../../hooks/useVolunteers';
import { useTasks } from '../../hooks/useTasks';
import { matchVolunteer } from '../../lib/gemini';
import { createTask, assignVolunteerToTask, sendNotification, updateReportStatus } from '../../lib/firestore';
import { FieldReport, Task } from '../../types';

function CommandCenter() {
  const { communities } = useCommunities();
  const { reports, refetch: refetchReports } = useReports();
  const { volunteers } = useVolunteers();
  const { tasks, refetch: refetchTasks } = useTasks();
  const [matchingId, setMatchingId] = useState<string | null>(null);
  const [creatingTask, setCreatingTask] = useState<string | null>(null);
  const navigate = useNavigate();

  const openTasks = tasks.filter((t) => t.status === 'open');
  const assignedTasks = tasks.filter((t) => t.status === 'assigned' || t.status === 'in-progress');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const avgUrgency = reports.length > 0 ? (reports.reduce((acc, r) => acc + r.urgencyScore, 0) / reports.length).toFixed(1) : '0.0';

  const handleCreateTask = async (report: FieldReport) => {
    setCreatingTask(report.reportId);
    try {
      await createTask({
        reportId: report.reportId,
        communityId: report.communityId,
        communityName: report.communityName,
        category: report.needCategory,
        description: report.description,
        urgencyScore: report.urgencyScore,
        assignedVolunteerId: null,
        assignedVolunteerName: null,
        status: 'open',
        matchReason: '',
        location: { lat: 0, lng: 0 },
      });
      await updateReportStatus(report.reportId, 'task-created');
      refetchReports();
      refetchTasks();
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setCreatingTask(null);
    }
  };

  const handleAIMatch = async (task: Task) => {
    setMatchingId(task.taskId);
    try {
      const result = await matchVolunteer(
        { category: task.category, description: task.description, location: task.location },
        volunteers
      );

      if (result.volunteerId) {
        await assignVolunteerToTask(task.taskId, result.volunteerId, result.volunteerName, result.matchReason);
        await sendNotification(result.volunteerId, {
          userId: result.volunteerId,
          title: 'New Task Assigned',
          message: `You've been matched to a ${task.category} task in ${task.communityName}: ${task.description.slice(0, 80)}`,
          type: 'task-assigned',
          read: false,
          linkTo: '/volunteer',
        });
        refetchTasks();
      }
    } catch (err) {
      console.error('Matching failed:', err);
    } finally {
      setMatchingId(null);
    }
  };

  return (
    <>
      <Header title="Command Center" subtitle="Aggregated community needs intelligence" />

      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Communities', value: communities.length, icon: MapPin, color: 'text-primary' },
          { label: 'Field Reports', value: reports.length, icon: FileText, color: 'text-blue-600' },
          { label: 'Open Tasks', value: openTasks.length, icon: AlertTriangle, color: 'text-danger' },
          { label: 'In Progress', value: assignedTasks.length, icon: ListTodo, color: 'text-warning' },
          { label: 'Volunteers', value: volunteers.length, icon: Users, color: 'text-success' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white border border-border rounded-xl p-4"
          >
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-[10px] font-semibold text-slate uppercase tracking-wider">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* AI Urgency Engine */}
        <div className="bg-gradient-to-br from-primary to-blue-800 text-white rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <Brain className="w-8 h-8 mb-2 opacity-80" />
          <div className="text-3xl font-bold mb-1">{avgUrgency}</div>
          <div className="text-xs font-semibold opacity-80">Avg Crisis Index</div>
          <div className="text-[10px] opacity-60 mt-2">Across {reports.length} field reports</div>
        </div>

        {/* Urgency Breakdown */}
        <div className="bg-white border border-border rounded-xl p-5 col-span-2">
          <h3 className="text-xs font-bold uppercase text-slate mb-3">Reports by Category</h3>
          <div className="space-y-2">
            {['Medical', 'Water', 'Food', 'Shelter', 'Sanitation', 'Education'].map((cat) => {
              const count = reports.filter((r) => r.needCategory === cat).length;
              const maxCount = Math.max(...['Medical', 'Water', 'Food', 'Shelter', 'Sanitation', 'Education'].map(
                (c) => reports.filter((r) => r.needCategory === c).length
              ), 1);
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate w-20">{cat}</span>
                  <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="mb-6">
        <CommunityMap
          communities={communities}
          volunteers={volunteers}
          communityUrgencies={Object.fromEntries(
            communities.map((c) => {
              const communityReports = reports.filter((r) => r.communityId === c.communityId);
              const avg = communityReports.length > 0
                ? communityReports.reduce((acc, r) => acc + r.urgencyScore, 0) / communityReports.length
                : 0;
              return [c.communityId, avg];
            })
          )}
          onCommunityClick={(id) => navigate(`/community/${id}`)}
          height="350px"
        />
      </div>

      {/* Task Queue + Recent Reports */}
      <div className="grid grid-cols-2 gap-4">
        {/* Task Queue */}
        <div className="bg-white border border-border rounded-xl p-5">
          <h3 className="text-xs font-bold uppercase text-slate mb-3 flex items-center gap-2">
            <ListTodo className="w-4 h-4" /> Task Queue ({tasks.length})
          </h3>
          {tasks.length === 0 ? (
            <p className="text-sm text-slate">No tasks created yet. Create tasks from field reports.</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {tasks.map((task) => (
                <div key={task.taskId} className="p-3 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold truncate">{task.communityName}</h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      task.urgencyScore >= 8 ? 'bg-red-50 text-danger' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {task.urgencyScore}/10
                    </span>
                  </div>
                  <p className="text-xs text-slate mb-2 truncate">{task.category} - {task.description}</p>
                  {task.status === 'open' ? (
                    <button
                      onClick={() => handleAIMatch(task)}
                      disabled={matchingId === task.taskId || volunteers.length === 0}
                      className="px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 disabled:opacity-50"
                    >
                      {matchingId === task.taskId ? 'AI Matching...' : 'AI Match Volunteer'}
                    </button>
                  ) : (
                    <div className="text-[10px]">
                      <span className="text-success font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {task.assignedVolunteerName} — {task.status}
                      </span>
                      {task.matchReason && <p className="text-slate mt-1">{task.matchReason}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Reports */}
        <div className="bg-white border border-border rounded-xl p-5">
          <h3 className="text-xs font-bold uppercase text-slate mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Field Reports ({reports.length})
          </h3>
          {reports.length === 0 ? (
            <p className="text-sm text-slate">No reports submitted yet.</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {reports.sort((a, b) => b.urgencyScore - a.urgencyScore).map((report) => (
                <div key={report.reportId} className="p-3 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold truncate">{report.communityName}</h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      report.urgencyScore >= 8 ? 'bg-red-50 text-danger' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {report.urgencyScore}/10
                    </span>
                  </div>
                  <p className="text-xs text-slate mb-1">{report.needCategory} — {report.description.slice(0, 80)}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate">by {report.ngoName} | {report.peopleAffected} affected</span>
                    {report.status === 'pending' && (
                      <button
                        onClick={() => handleCreateTask(report)}
                        disabled={creatingTask === report.reportId}
                        className="px-2 py-1 bg-slate-900 text-white rounded text-[10px] font-bold hover:bg-black disabled:opacity-50"
                      >
                        {creatingTask === report.reportId ? 'Creating...' : 'Create Task'}
                      </button>
                    )}
                    {report.status === 'task-created' && (
                      <span className="text-[10px] font-bold text-success">Task Created</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function CommunitiesList() {
  const { communities, loading } = useCommunities();
  const navigate = useNavigate();

  return (
    <>
      <Header title="Communities" subtitle="All registered communities across the platform" />
      {loading ? <p className="text-sm text-slate">Loading...</p> : (
        <div className="grid grid-cols-2 gap-4">
          {communities.map((c) => (
            <div
              key={c.communityId}
              onClick={() => navigate(`/community/${c.communityId}`)}
              className="bg-white border border-border rounded-xl p-5 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all"
            >
              <h3 className="font-bold mb-1">{c.name}</h3>
              <p className="text-xs text-slate">{c.district}, {c.state} — {c.pinCode}</p>
              <div className="flex gap-3 mt-3 text-xs">
                <span className="px-2 py-1 bg-slate-100 rounded font-semibold">{c.areaType}</span>
                <span className="px-2 py-1 bg-slate-100 rounded font-semibold">Pop: ~{c.populationApprox}</span>
              </div>
            </div>
          ))}
          {communities.length === 0 && <p className="text-sm text-slate col-span-2">No communities registered yet. They are created when NGOs submit reports.</p>}
        </div>
      )}
    </>
  );
}

function VolunteersList() {
  const { volunteers, loading } = useVolunteers();

  return (
    <>
      <Header title="Volunteer Network" subtitle="All active volunteers on the platform" />
      {loading ? <p className="text-sm text-slate">Loading...</p> : (
        <div className="grid grid-cols-2 gap-4">
          {volunteers.map((v) => (
            <div key={v.volunteerId} className="bg-white border border-border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary-soft rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold">{v.name}</h3>
                  <p className="text-xs text-slate">{v.locationText} — {v.availability}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {v.skills.map((s) => (
                  <span key={s} className="px-2 py-0.5 bg-primary-soft text-primary text-[10px] font-bold rounded">{s}</span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {v.languages.map((l) => (
                  <span key={l} className="px-2 py-0.5 bg-slate-100 text-slate text-[10px] font-semibold rounded">{l}</span>
                ))}
              </div>
              <p className="text-[10px] text-slate mt-2">{v.experienceLevel} | Travel: {v.willingToTravel ? `${v.maxTravelKm}km` : 'No'}</p>
            </div>
          ))}
          {volunteers.length === 0 && <p className="text-sm text-slate col-span-2">No volunteers registered yet.</p>}
        </div>
      )}
    </>
  );
}

function TasksList() {
  const { tasks, loading, refetch } = useTasks();

  return (
    <>
      <Header title="All Tasks" subtitle="Task management and tracking" />
      {loading ? <p className="text-sm text-slate">Loading...</p> : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.taskId} className="bg-white border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold">{task.communityName}</h3>
                  <p className="text-sm text-slate">{task.category} — {task.description.slice(0, 100)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    task.urgencyScore >= 8 ? 'bg-red-50 text-danger' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {task.urgencyScore}/10
                  </span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                    task.status === 'open' ? 'bg-red-50 text-danger' :
                    task.status === 'assigned' ? 'bg-blue-50 text-primary' :
                    task.status === 'in-progress' ? 'bg-yellow-50 text-warning' :
                    'bg-green-50 text-success'
                  }`}>
                    {task.status}
                  </span>
                </div>
              </div>
              {task.assignedVolunteerName && (
                <p className="text-xs text-slate">Assigned to: <span className="font-semibold">{task.assignedVolunteerName}</span></p>
              )}
              {task.matchReason && <p className="text-[10px] text-slate mt-1">{task.matchReason}</p>}
            </div>
          ))}
          {tasks.length === 0 && <p className="text-sm text-slate">No tasks created yet.</p>}
        </div>
      )}
    </>
  );
}

export default function AdminDashboard() {
  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <Routes>
          <Route index element={<CommandCenter />} />
          <Route path="communities" element={<CommunitiesList />} />
          <Route path="reports" element={<AdminReportsView />} />
          <Route path="volunteers" element={<VolunteersList />} />
          <Route path="tasks" element={<TasksList />} />
        </Routes>
      </main>
    </div>
  );
}

function AdminReportsView() {
  const { reports, loading } = useReports();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? reports : reports.filter((r) => r.needCategory === filter);

  return (
    <>
      <Header title="All Reports" subtitle="Field reports from all NGOs across the platform" />
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
              by {report.ngoName} ({report.fieldWorkerName}) | {report.peopleAffected} affected | {report.dateOfSurvey} | Source: {report.sourceType}
            </p>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-slate">No reports found.</p>}
      </div>
    </>
  );
}
