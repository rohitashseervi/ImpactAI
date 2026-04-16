import { motion } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  variant?: 'landing' | 'dashboard';
}

export default function ThemeToggle({ variant = 'dashboard' }: Props) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'landing') {
    return (
      <button
        onClick={toggleTheme}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-300 bg-white/5 border border-white/10 hover:bg-white/10 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <motion.div
          key={theme}
          initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.3, ease: [0.51, 0, 0.08, 1] }}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-yellow-400" />
          ) : (
            <Moon className="w-4 h-4 text-white/70" />
          )}
        </motion.div>
      </button>
    );
  }

  // Dashboard variant
  return (
    <button
      onClick={toggleTheme}
      className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-300 border border-border hover:bg-slate-100 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.3, ease: [0.51, 0, 0.08, 1] }}
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-yellow-400" />
        ) : (
          <Moon className="w-4 h-4 text-slate" />
        )}
      </motion.div>
    </button>
  );
}
