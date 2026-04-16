import { Activity } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="h-screen flex items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3">
        <Activity className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-medium text-slate">Loading...</p>
      </div>
    </div>
  );
}
