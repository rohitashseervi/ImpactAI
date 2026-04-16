import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ListTodo,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Bell,
  ArrowRight,
} from 'lucide-react';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';
import { useAuth } from '../../contexts/AuthContext';
import { useTasks } from '../../hooks/useTasks';
import { useNotifications } from '../../hooks/useNotifications';
import { updateTaskStatus } from '../../lib/firestore';
import { TaskStatus } from '../../types';

function MyTasks() {
  const { user } = useAuth();
  const { tasks, loading, refetch } = useTasks({ volunteerId: user?.uid });
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusUpdate = async (taskId: string, newStatus: TaskStatus) => {
    setUpdatingId(taskId);
    try {
      await updateTaskStatus(taskId, newStatus);
      refetch();
    } catch (err) {
      console.error('Failed to update task:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const openTasks = tasks.filter((t) => t.status === 'assigned');
  const inProgress = tasks.filter((t) => t.status === 'in-progress');
  const completed = tasks.filter((t) => t.status === 'completed');

  return (
    <>
      <Header title="My Tasks" subtitle="Tasks assigned to you by the AI matching system" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-border rounded-xl p-5">
          <AlertTriangle className="w-5 h-5 text-danger mb-2" />
          <div className="text-2xl font-bold text-danger">{openTasks.length}</div>
          <div className="text-[10px] font-semibold text-slate uppercase">Assigned</div>
        </div>
        <div className="bg-white border border-border rounded-xl p-5">
          <Clock className="w-5 h-5 text-warning mb-2" />
          <div className="text-2xl font-bold text-warning">{inProgress.length}</div>
          <div className="text-[10px] font-semibold text-slate uppercase">In Progress</div>
        </div>
        <div className="bg-white border border-border rounded-xl p-5">
          <CheckCircle2 className="w-5 h-5 text-success mb-2" />
          <div className="text-2xl font-bold text-success">{completed.length}</div>
          <div className="text-[10px] font-semibold text-slate uppercase">Completed</div>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <p className="text-sm text-slate">Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-12 text-center">
          <ListTodo className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">No tasks yet</h3>
          <p className="text-sm text-slate">When the admin matches you to a community need, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <motion.div
              key={task.taskId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-border rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">{task.communityName}</h3>
                  <p className="text-sm text-slate">{task.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    task.urgencyScore >= 8 ? 'bg-red-50 text-danger' : 'bg-orange-50 text-orange-600'
                  }`}>
                    Urgency: {task.urgencyScore}/10
                  </span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                    task.status === 'assigned' ? 'bg-blue-50 text-primary' :
                    task.status === 'in-progress' ? 'bg-yellow-50 text-warning' :
                    'bg-green-50 text-success'
                  }`}>
                    {task.status}
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate mb-3">{task.description}</p>

              {task.matchReason && (
                <p className="text-xs text-slate bg-slate-50 p-2 rounded-lg mb-3">
                  <span className="font-bold">Why you were matched:</span> {task.matchReason}
                </p>
              )}

              <div className="flex gap-2">
                {task.status === 'assigned' && (
                  <button
                    onClick={() => handleStatusUpdate(task.taskId, 'in-progress')}
                    disabled={updatingId === task.taskId}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    {updatingId === task.taskId ? 'Updating...' : 'Start Working'}
                  </button>
                )}
                {task.status === 'in-progress' && (
                  <button
                    onClick={() => handleStatusUpdate(task.taskId, 'completed')}
                    disabled={updatingId === task.taskId}
                    className="px-4 py-2 bg-success text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {updatingId === task.taskId ? 'Updating...' : 'Mark Complete'}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </>
  );
}

function NotificationsList() {
  const { notifications, markAsRead } = useNotifications();

  return (
    <>
      <Header title="Notifications" subtitle="Stay updated on task assignments and status changes" />
      {notifications.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-12 text-center">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">No notifications</h3>
          <p className="text-sm text-slate">You'll be notified when tasks are assigned to you.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => !notif.read && markAsRead(notif.id)}
              className={`bg-white border rounded-xl p-4 cursor-pointer transition-colors ${
                notif.read ? 'border-border' : 'border-primary/30 bg-primary-soft/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-sm">{notif.title}</h4>
                <span className="text-[10px] text-slate">{new Date(notif.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-slate">{notif.message}</p>
              {!notif.read && <span className="text-[10px] font-bold text-primary mt-1 block">New</span>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function VolunteerDashboard() {
  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <Routes>
          <Route index element={<MyTasks />} />
          <Route path="notifications" element={<NotificationsList />} />
        </Routes>
      </main>
    </div>
  );
}
