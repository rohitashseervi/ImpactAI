import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import {
  Activity,
  Building2,
  HandHeart,
  ShieldCheck,
  Scan,
  Brain,
  MapPin,
  Users,
  ArrowRight,
  Zap,
  BarChart3,
  Globe,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/Common/ThemeToggle';
import { useEffect, useRef, useState } from 'react';

// Animated counter hook
function useCounter(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return { count, ref };
}

export default function Landing() {
  const navigate = useNavigate();
  const { user, userProfile, loading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (!loading && user && userProfile) {
      navigate(`/${userProfile.role}`, { replace: true });
    }
  }, [user, userProfile, loading, navigate]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const stat1 = useCounter(7, 1500);
  const stat2 = useCounter(15, 1800);
  const stat3 = useCounter(10, 1600);

  return (
    <div className={`min-h-screen overflow-x-hidden transition-colors duration-500 ${isDark ? 'bg-[#011829] text-white' : 'bg-[#F8FAFB] text-[#1a1a2e]'}`}>
      {/* ========== NAVBAR ========== */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.51, 0, 0.08, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-colors duration-500 ${isDark ? 'bg-[#011829]/80 border-white/5' : 'bg-white/80 border-black/5'}`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-bold text-xl">
            <div className="w-8 h-8 bg-[#298DFF] rounded-lg flex items-center justify-center">
              <Activity className="text-white w-4.5 h-4.5" />
            </div>
            <span className="tracking-tight">ImpactAI</span>
          </div>

          <div className={`hidden md:flex items-center gap-8 text-sm ${isDark ? 'text-white/60' : 'text-black/50'}`}>
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-black'}`}>Features</button>
            <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-black'}`}>How it Works</button>
            <button onClick={() => document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth' })} className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-black'}`}>Get Started</button>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle variant="landing" />
            <button
              onClick={() => navigate('/login')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${isDark ? 'text-white/80 hover:text-white' : 'text-black/60 hover:text-black'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register/ngo')}
              className="px-5 py-2.5 text-sm font-semibold bg-[#298DFF] text-white rounded-lg hover:bg-[#5CA9FF] transition-all duration-300"
            >
              Get Started
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ========== HERO SECTION ========== */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        onMouseMove={handleMouseMove}
        className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden"
      >
        {/* Animated gradient background */}
        <div
          className="absolute inset-0 transition-all duration-700 ease-out"
          style={{
            background: isDark
              ? `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(41,141,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(92,169,255,0.08) 0%, transparent 40%), radial-gradient(circle at 20% 80%, rgba(41,141,255,0.06) 0%, transparent 40%)`
              : `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(41,141,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(92,169,255,0.05) 0%, transparent 40%), radial-gradient(circle at 20% 80%, rgba(41,141,255,0.03) 0%, transparent 40%)`,
          }}
        />
        {/* Grid overlay */}
        <div className={`absolute inset-0 ${isDark ? 'opacity-[0.03]' : 'opacity-[0.04]'}`} style={{ backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'} 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.51, 0, 0.08, 1] }}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium text-[#298DFF] mb-8 backdrop-blur-sm ${isDark ? 'bg-white/5 border border-white/10' : 'bg-[#298DFF]/5 border border-[#298DFF]/15'}`}
          >
            <Zap className="w-3 h-3" />
            Powered by Google Gemini AI
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.51, 0, 0.08, 1] }}
            className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6"
          >
            The Intelligence Layer for{' '}
            <span className="bg-gradient-to-r from-[#298DFF] via-[#5CA9FF] to-[#8FCBFF] bg-clip-text text-transparent">
              Social Impact
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7, ease: [0.51, 0, 0.08, 1] }}
            className={`text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed ${isDark ? 'text-white/50' : 'text-black/45'}`}
          >
            Gather scattered community data from NGOs. See the most urgent needs clearly.
            Smart-match volunteers to where they matter most.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6, ease: [0.51, 0, 0.08, 1] }}
            className="flex items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate('/register/ngo')}
              className="group px-8 py-3.5 bg-[#298DFF] text-white font-semibold rounded-xl hover:bg-[#5CA9FF] transition-all duration-300 flex items-center gap-2"
            >
              Start Contributing
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className={`px-8 py-3.5 font-semibold rounded-xl transition-all duration-300 backdrop-blur-sm ${isDark ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20' : 'bg-black/5 border border-black/10 text-[#1a1a2e] hover:bg-black/10 hover:border-black/20'}`}
            >
              Sign In
            </button>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="mt-20"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className={`w-6 h-10 rounded-full border-2 mx-auto flex items-start justify-center pt-2 ${isDark ? 'border-white/20' : 'border-black/15'}`}
            >
              <div className={`w-1 h-2 rounded-full ${isDark ? 'bg-white/40' : 'bg-black/30'}`} />
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* ========== STATS BAR ========== */}
      <section className={`relative border-t border-b transition-colors duration-500 ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-black/5 bg-black/[0.02]'}`}>
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-3 gap-8">
          {[
            { ref: stat1.ref, count: stat1.count, suffix: '+', label: 'Communities Tracked', icon: Globe },
            { ref: stat2.ref, count: stat2.count, suffix: '+', label: 'Field Reports', icon: BarChart3 },
            { ref: stat3.ref, count: stat3.count, suffix: '+', label: 'Active Volunteers', icon: Users },
          ].map((s, i) => (
            <div key={i} ref={s.ref} className="text-center">
              <s.icon className="w-5 h-5 text-[#298DFF] mx-auto mb-3" />
              <div className={`text-4xl md:text-5xl font-black mb-1 ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>
                {s.count}{s.suffix}
              </div>
              <div className={`text-sm font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== FEATURES SECTION ========== */}
      <section id="features" className="py-24 md:py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, ease: [0.51, 0, 0.08, 1] }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#298DFF]/10 border border-[#298DFF]/20 text-xs font-semibold text-[#5CA9FF] mb-4">
              CORE CAPABILITIES
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              AI-Powered. End-to-End.
            </h2>
            <p className={`max-w-xl mx-auto ${isDark ? 'text-white/40' : 'text-black/45'}`}>
              From field data collection to intelligent volunteer dispatch — powered entirely by Google's AI ecosystem.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: Brain,
                title: 'AI Urgency Scoring',
                desc: 'Gemini AI analyzes field reports and assigns urgency scores from 1-10. Medical emergencies, water crises, and food shortages are automatically prioritized.',
                gradient: 'from-[#298DFF]/20 to-transparent',
              },
              {
                icon: Scan,
                title: 'OCR Paper Scanning',
                desc: 'Photograph handwritten field surveys. Gemini Vision extracts community names, need categories, descriptions, and affected population counts automatically.',
                gradient: 'from-[#5CA9FF]/20 to-transparent',
              },
              {
                icon: Users,
                title: 'Smart Volunteer Matching',
                desc: 'AI evaluates volunteer skills, location, availability, and experience — then recommends the optimal match for each task with detailed reasoning.',
                gradient: 'from-[#8FCBFF]/20 to-transparent',
              },
              {
                icon: MapPin,
                title: 'Live Deployment Maps',
                desc: 'Google Maps integration shows communities color-coded by urgency and volunteer positions in real-time. Click any pin for instant context.',
                gradient: 'from-[#298DFF]/20 to-transparent',
              },
            ].map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.51, 0, 0.08, 1] }}
                className={`group relative rounded-2xl p-8 transition-all duration-500 cursor-default overflow-hidden ${isDark ? 'bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10' : 'bg-white border border-black/5 hover:border-[#298DFF]/20 hover:shadow-lg shadow-sm'}`}
              >
                <div className={`absolute top-0 left-0 w-40 h-40 bg-gradient-to-br ${feat.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-[#298DFF]/10 border border-[#298DFF]/20 rounded-xl flex items-center justify-center mb-5 group-hover:bg-[#298DFF]/20 transition-colors duration-500">
                    <feat.icon className="w-5 h-5 text-[#298DFF]" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 group-hover:text-[#5CA9FF] transition-colors duration-300">{feat.title}</h3>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-white/40' : 'text-black/45'}`}>{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how-it-works" className={`py-24 md:py-32 bg-gradient-to-b from-transparent to-transparent ${isDark ? 'via-[#298DFF]/[0.03]' : 'via-[#298DFF]/[0.02]'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, ease: [0.51, 0, 0.08, 1] }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#298DFF]/10 border border-[#298DFF]/20 text-xs font-semibold text-[#5CA9FF] mb-4">
              THE FLOW
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              From Field to Action
            </h2>
            <p className={`max-w-xl mx-auto ${isDark ? 'text-white/40' : 'text-black/45'}`}>
              Five steps from scattered field data to coordinated community response.
            </p>
          </motion.div>

          <div className="relative max-w-4xl mx-auto">
            {/* Vertical line */}
            <div className={`absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-transparent to-transparent hidden md:block ${isDark ? 'via-[#298DFF]/30' : 'via-[#298DFF]/20'}`} />

            {[
              { step: '01', title: 'NGOs Collect Data', desc: 'Field workers survey communities using paper forms or the app. Multiple NGOs contribute independently.', color: '#298DFF' },
              { step: '02', title: 'AI Digitizes & Scores', desc: 'OCR scans paper surveys. Gemini AI assigns urgency scores (1-10) based on need severity and affected population.', color: '#5CA9FF' },
              { step: '03', title: 'Data Aggregates Centrally', desc: 'Scattered reports merge into one dashboard. Duplicate communities are detected. The full picture emerges.', color: '#8FCBFF' },
              { step: '04', title: 'Admin Creates Tasks', desc: 'Coordinators review verified reports and create actionable tasks for the most urgent needs.', color: '#298DFF' },
              { step: '05', title: 'AI Matches Volunteers', desc: 'Gemini analyzes skills, location, and availability to match the best volunteer. They get notified instantly.', color: '#5CA9FF' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.51, 0, 0.08, 1] }}
                className="flex gap-6 mb-8 last:mb-0"
              >
                <div className={`relative z-10 shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/[0.03] border border-white/10' : 'bg-white border border-black/5 shadow-sm'}`}>
                  <span className="text-lg font-black" style={{ color: item.color }}>{item.step}</span>
                </div>
                <div className="pt-2">
                  <h3 className="text-lg font-bold mb-1">{item.title}</h3>
                  <p className={`text-sm leading-relaxed max-w-lg ${isDark ? 'text-white/40' : 'text-black/45'}`}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== ROLE CARDS (GET STARTED) ========== */}
      <section id="roles" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, ease: [0.51, 0, 0.08, 1] }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#298DFF]/10 border border-[#298DFF]/20 text-xs font-semibold text-[#5CA9FF] mb-4">
              JOIN THE PLATFORM
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Choose Your Role
            </h2>
            <p className={`max-w-xl mx-auto ${isDark ? 'text-white/40' : 'text-black/45'}`}>
              Whether you collect data, provide help, or coordinate — there's a place for you.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[
              {
                icon: Building2,
                title: 'NGO / Social Group',
                desc: 'Submit field reports from community surveys. Scan paper forms with AI. Track your contributions and their impact.',
                cta: 'Register as NGO',
                route: '/register/ngo',
                accent: '#298DFF',
              },
              {
                icon: HandHeart,
                title: 'Volunteer',
                desc: 'Get AI-matched to tasks that fit your skills and location. Receive real-time notifications. Track your impact.',
                cta: 'Register as Volunteer',
                route: '/register/volunteer',
                accent: '#34A853',
              },
              {
                icon: ShieldCheck,
                title: 'Admin / Coordinator',
                desc: 'Full command center access. View all data, manage AI matching, create tasks, generate impact analytics.',
                cta: 'Sign In as Admin',
                route: '/login',
                accent: '#FBBC04',
              },
            ].map((role, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.15, duration: 0.6, ease: [0.51, 0, 0.08, 1] }}
                onClick={() => navigate(role.route)}
                className={`group relative rounded-2xl p-8 cursor-pointer transition-all duration-500 overflow-hidden ${isDark ? 'bg-white/[0.03] border border-white/5 hover:border-white/15' : 'bg-white border border-black/5 hover:border-[#298DFF]/20 hover:shadow-lg shadow-sm'}`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ backgroundColor: `${role.accent}20` }} />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border transition-all duration-500" style={{ backgroundColor: `${role.accent}10`, borderColor: `${role.accent}30` }}>
                    <role.icon className="w-6 h-6" style={{ color: role.accent }} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{role.title}</h3>
                  <p className={`text-sm leading-relaxed mb-6 ${isDark ? 'text-white/40' : 'text-black/45'}`}>{role.desc}</p>
                  <div className="flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all duration-300" style={{ color: role.accent }}>
                    {role.cta}
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TECH STACK BANNER ========== */}
      <section className={`py-16 border-t border-b transition-colors duration-500 ${isDark ? 'border-white/5' : 'border-black/5'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <p className={`text-center text-xs font-semibold uppercase tracking-widest mb-8 ${isDark ? 'text-white/20' : 'text-black/25'}`}>
            Built on Google's Ecosystem
          </p>
          <div className="flex items-center justify-center gap-12 md:gap-20 flex-wrap">
            {['Gemini AI', 'Firebase', 'Cloud Firestore', 'Google Maps', 'Realtime DB'].map((tech, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`text-sm md:text-base font-bold transition-colors duration-500 ${isDark ? 'text-white/15 hover:text-white/40' : 'text-black/15 hover:text-black/40'}`}
              >
                {tech}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="py-24 md:py-32 relative">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(41,141,255,0.08) 0%, transparent 60%)' }} />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.51, 0, 0.08, 1] }}
          className="relative z-10 max-w-3xl mx-auto px-6 text-center"
        >
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">
            Ready to Make an{' '}
            <span className="bg-gradient-to-r from-[#298DFF] to-[#5CA9FF] bg-clip-text text-transparent">Impact</span>?
          </h2>
          <p className={`mb-10 max-w-lg mx-auto ${isDark ? 'text-white/40' : 'text-black/45'}`}>
            Join the platform that turns scattered field data into coordinated action.
            Every report submitted, every volunteer matched — every life changed.
          </p>
          <button
            onClick={() => navigate('/register/ngo')}
            className="group px-10 py-4 bg-[#298DFF] text-white font-bold rounded-xl hover:bg-[#5CA9FF] transition-all duration-300 text-lg flex items-center gap-3 mx-auto"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </motion.div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className={`border-t py-8 transition-colors duration-500 ${isDark ? 'border-white/5' : 'border-black/5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className={`flex items-center gap-2 text-sm font-bold ${isDark ? 'text-white/30' : 'text-black/30'}`}>
            <div className="w-5 h-5 bg-[#298DFF]/30 rounded flex items-center justify-center">
              <Activity className="text-[#298DFF] w-3 h-3" />
            </div>
            ImpactAI
          </div>
          <p className={`text-xs ${isDark ? 'text-white/20' : 'text-black/25'}`}>
            Built for the Google Solution Hackathon 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
