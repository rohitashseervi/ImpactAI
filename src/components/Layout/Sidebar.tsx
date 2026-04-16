import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import ThemeToggle from '../Common/ThemeToggle';
import {
  Activity,
  LayoutDashboard,
  FileText,
  Scan,
  Users,
  ClipboardCheck,
  MapPin,
  Bell,
  LogOut,
  User,
  ListTodo,
} from 'lucide-react';

const ngoNavItems = [
  { to: '/ngo', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/ngo/submit', label: 'Submit Report', icon: FileText },
  { to: '/ngo/ocr', label: 'OCR Scanner', icon: Scan },
  { to: '/ngo/reports', label: 'My Reports', icon: ClipboardCheck },
];

const volunteerNavItems = [
  { to: '/volunteer', label: 'My Tasks', icon: ListTodo, end: true },
  { to: '/volunteer/notifications', label: 'Notifications', icon: Bell },
];

const adminNavItems = [
  { to: '/admin', label: 'Command Center', icon: LayoutDashboard, end: true },
  { to: '/admin/communities', label: 'Communities', icon: MapPin },
  { to: '/admin/reports', label: 'All Reports', icon: FileText },
  { to: '/admin/volunteers', label: 'Volunteers', icon: Users },
  { to: '/admin/tasks', label: 'Tasks', icon: ListTodo },
];

export default function Sidebar() {
  const { userProfile, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const role = userProfile?.role;
  const navItems = role === 'ngo' ? ngoNavItems : role === 'volunteer' ? volunteerNavItems : adminNavItems;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <aside className="w-60 bg-white border-r border-border p-6 flex flex-col gap-6 shrink-0">
      <div className="flex items-center gap-2 font-bold text-xl text-primary">
        <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
          <Activity className="text-white w-4 h-4" />
        </div>
        ImpactAI
      </div>

      <div className="px-3 py-2 bg-primary-soft rounded-lg">
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary/60">Logged in as</p>
        <p className="text-sm font-semibold text-primary truncate">{userProfile?.displayName}</p>
        <p className="text-[10px] text-primary/70 uppercase">{role}</p>
      </div>

      <nav className="flex-1">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary-soft text-primary' : 'text-slate hover:bg-slate-50'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                {item.label === 'Notifications' && unreadCount > 0 && (
                  <span className="ml-auto bg-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto pt-4 border-t border-border space-y-2">
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-xs font-semibold text-slate">Theme</span>
          <ThemeToggle variant="dashboard" />
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate hover:bg-slate-50 transition-colors"
        >
          <User className="w-4 h-4" /> Profile
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-danger hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </aside>
  );
}
