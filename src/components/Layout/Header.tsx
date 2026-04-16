import { Bell } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

interface Props {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: Props) {
  const { unreadCount } = useNotifications();

  return (
    <header className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-slate mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5 text-slate" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-danger text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
