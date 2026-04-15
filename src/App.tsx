/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, 
  ClipboardCheck, 
  LayoutDashboard, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  MapPin, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  Search,
  Users,
  Activity,
  Camera,
  Scan,
  FileText
} from 'lucide-react';
import { calculateUrgencyScore, matchVolunteer, extractDataFromImage, UrgencyResult, VolunteerMatch } from './lib/gemini';
import { db, Task } from './lib/db';

// --- Types ---

type Screen = 'dialer' | 'survey' | 'success' | 'dashboard' | 'volunteers' | 'reports' | 'ocr';

// --- Components ---

const Keypad = ({ onInput }: { onInput: (val: string) => void }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
  return (
    <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
      {keys.map((key) => (
        <button
          key={key}
          onClick={() => onInput(key)}
          className="w-16 h-16 rounded-full bg-white border border-blue-100 flex items-center justify-center text-xl font-semibold text-blue-900 hover:bg-blue-50 active:scale-95 transition-all shadow-sm"
        >
          {key}
        </button>
      ))}
    </div>
  );
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [aadhaar, setAadhaar] = useState('');
  const [error, setError] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTask, setCurrentTask] = useState<Partial<Task>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [matchingId, setMatchingId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<any>(null);

  // Initialize DB
  useEffect(() => {
    db.init();
    setTasks(db.getTasks().sort((a, b) => b.urgency.score - a.urgency.score));
  }, []);

  const handleOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const data = await extractDataFromImage(base64);
        
        if (data.aadhaar || data.name || data.description) {
          setOcrResult(data);
          setAadhaar(data.aadhaar?.replace(/\D/g, '').slice(0, 12) || '');
          setScreen('survey');
        } else {
          setError('Could not extract clear data from the image. Please try a clearer photo.');
        }
        setOcrLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setError('Error processing image.');
      setOcrLoading(false);
    }
  };

  const handleDial = (val: string) => {
    if (aadhaar.length < 12) {
      setAadhaar(prev => prev + val);
    }
  };

  const verifyAadhaar = () => {
    if (aadhaar.length !== 12) {
      setError('Please enter a valid 12-digit Aadhaar ID');
      return;
    }

    const check = db.checkAadhaar(aadhaar);
    
    if (check.exists) {
      if (check.source === 'local') {
        // Already surveyed locally or synced from peer
        setCurrentTask(check.task!);
        setScreen('success');
        setError('');
      } else if (check.source === 'cloud') {
        // Exists in cloud (done by someone else and synced)
        setError('This ID was already surveyed and uploaded to the Cloud by another volunteer.');
        setCurrentTask(check.task!);
        setScreen('success');
      } else {
        // Exists in master list (already done by someone else in the target area)
        setError('This ID is already marked as "Done" in the Global Master List.');
      }
      return;
    }

    setError('');
    setScreen('survey');
  };

  const submitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const description = formData.get('description') as string;
    const name = formData.get('name') as string;
    const manualUrgency = parseInt(formData.get('manualUrgency') as string);
    const manualCategory = formData.get('manualCategory') as string;
    const location = "Simulated GPS: 12.9716° N, 77.5946° E";

    // Create task immediately with manual data for offline speed
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      aadhaar,
      name,
      location,
      description,
      urgency: { score: manualUrgency, category: manualCategory, reason: "Manual assessment" },
      manualUrgency,
      manualCategory,
      timestamp: new Date().toLocaleString(),
      status: 'pending',
      isSynced: false
    };

    // Save locally first
    db.saveTask(newTask);
    setTasks(db.getTasks().sort((a, b) => b.urgency.score - a.urgency.score));
    setCurrentTask(newTask);
    setScreen('success');
    setIsAnalyzing(false);

    // AI Analysis runs in "background" (simulated)
    // In a real app, this would happen when back online or via a local model
    calculateUrgencyScore(description).then(aiUrgency => {
      const updatedTask = { ...newTask, urgency: aiUrgency };
      db.updateTask(updatedTask);
      setTasks(db.getTasks().sort((a, b) => b.urgency.score - a.urgency.score));
    });

    // Simulate P2P "Whispering"
    simulateWhispering(newTask);
  };

  const simulatePeerSync = () => {
    const peerTask: Task = {
      id: 'peer_' + Math.random().toString(36).substr(2, 5),
      aadhaar: '999988887777',
      name: 'Peer Entry',
      location: 'Nearby Zone B',
      description: 'Medical supplies needed urgently.',
      urgency: { score: 9, category: 'Medical', reason: 'Peer assessment' },
      manualUrgency: 9,
      manualCategory: 'Medical',
      timestamp: new Date().toLocaleString(),
      status: 'pending',
      isSynced: false
    };

    const added = db.receivePeerData(peerTask);
    if (added) {
      setTasks(db.getTasks().sort((a, b) => b.urgency.score - a.urgency.score));
      setSyncStatus('Received new survey from Volunteer B via Bluetooth!');
      setTimeout(() => setSyncStatus(null), 3000);
    } else {
      setSyncStatus('Peer sync check: No new data found.');
      setTimeout(() => setSyncStatus(null), 2000);
    }
  };

  const simulateWhispering = (task: Task) => {
    setSyncStatus('Whispering to nearby volunteers...');
    setTimeout(() => {
      setSyncStatus(`Sync complete: Shared ID ${task.aadhaar.slice(-4)} with 2 peers via Bluetooth.`);
      setTimeout(() => setSyncStatus(null), 3000);
    }, 2000);
  };

  const handleSyncCloud = () => {
    setSyncStatus('Syncing with Cloud Server...');
    setTimeout(() => {
      const uploaded = db.syncWithCloud();
      setTasks(db.getTasks().sort((a, b) => b.urgency.score - a.urgency.score));
      setSyncStatus(`Cloud Sync Successful: ${uploaded} new entries uploaded.`);
      setTimeout(() => setSyncStatus(null), 3000);
    }, 2000);
  };

  const handleResetLocal = () => {
    db.resetLocalData();
    setTasks(db.getTasks());
    setAadhaar('');
    setScreen('dashboard');
    setSyncStatus('Local Phone Data Reset. Cloud data remains safe.');
    setTimeout(() => setSyncStatus(null), 3000);
  };

  const handleMatch = async (taskId: string) => {
    setMatchingId(taskId);
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const match = await matchVolunteer({ 
        category: task.urgency.category, 
        description: task.description 
      });
      const updatedTask: Task = { ...task, status: 'matched', matchedVolunteer: match };
      db.updateTask(updatedTask);
      setTasks(db.getTasks().sort((a, b) => b.urgency.score - a.urgency.score));
    }
    setMatchingId(null);
  };

  return (
    <div className="flex h-screen bg-bg text-ink font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-60 bg-white border-r border-border p-6 flex flex-col gap-8">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
            <Activity className="text-white w-4 h-4" />
          </div>
          ImpactAI
        </div>
        
        <nav className="flex-1">
          <ul className="space-y-1">
            {[
              { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
              { id: 'dialer', label: 'Field Intake', icon: Phone },
              { id: 'ocr', label: 'Smart Scanner', icon: Scan },
              { id: 'volunteers', label: 'Volunteer Network', icon: Users },
              { id: 'reports', label: 'Impact Reports', icon: ClipboardCheck },
            ].map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setScreen(item.id as Screen)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    screen === item.id ? 'bg-primary-soft text-primary' : 'text-slate hover:bg-slate-50'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto pt-6 border-t border-border">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate mb-2">System Status</div>
          <div className="flex items-center gap-2 text-xs font-semibold text-success mb-4">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            Active & Secure
          </div>
          <button 
            onClick={handleSyncCloud}
            className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-all flex items-center justify-center gap-2 mb-2"
          >
            <Activity className="w-3 h-3" /> Sync with Cloud
          </button>
          <button 
            onClick={simulatePeerSync}
            className="w-full py-2 bg-blue-50 text-primary border border-blue-100 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all flex items-center justify-center gap-2 mb-4"
          >
            <Users className="w-3 h-3" /> Simulate Peer Sync
          </button>
          <button 
            onClick={handleResetLocal}
            className="w-full py-2 border border-red-200 text-red-600 rounded-lg text-[10px] font-bold hover:bg-red-50 transition-all"
          >
            Reset Offline DB
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-y-auto relative">
        {/* Sync Status Toast */}
        <AnimatePresence>
          {syncStatus && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-ink text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 text-sm font-medium border border-white/10"
            >
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" />
              {syncStatus}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* Dashboard View (Bento Grid) */}
          {screen === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bento-grid"
            >
              {/* Part 1: Dialer Card */}
              <section className="bento-card bento-dialer">
                <h3 className="bento-card-title">Offline Gatekeeper</h3>
                <div className="bg-slate-100 p-3 rounded-lg font-mono text-center mb-4 text-sm tracking-widest">
                  {aadhaar ? aadhaar.replace(/(.{4})/g, '$1 ').trim() : '4291 5582 ****'}
                </div>
                <div className="text-[11px] text-slate mb-4">Enter unique Aadhaar for identity verification.</div>
                
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-4 p-2 bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold rounded-lg flex items-center gap-2 justify-center"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {error}
                  </motion.div>
                )}
                
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => (
                    <button
                      key={key}
                      onClick={() => handleDial(key)}
                      className="h-10 border border-border rounded-lg flex items-center justify-center font-semibold bg-bg hover:bg-slate-50 active:scale-95 transition-all"
                    >
                      {key}
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-2 mt-auto">
                  <button onClick={() => setAadhaar('')} className="flex-1 py-2 text-xs font-bold border border-border rounded-lg hover:bg-slate-50">Clear</button>
                  <button onClick={verifyAadhaar} className="flex-1 py-2 text-xs font-bold bg-primary text-white rounded-lg hover:bg-blue-700 shadow-sm">Verify</button>
                </div>
              </section>

              {/* Part 4: Task Dashboard Card */}
              <section className="bento-card bento-tasks">
                <h3 className="bento-card-title">Live Allocation Queue</h3>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {tasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                      <Search className="w-8 h-8 mb-2" />
                      <p className="text-xs font-medium">No active cases</p>
                    </div>
                  ) : (
                    tasks.map((task) => (
                      <div key={task.id} className="p-3 border border-border rounded-xl flex justify-between items-center gap-4 bg-white hover:border-primary/30 transition-colors">
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold truncate">{task.name}</h4>
                          <p className="text-[11px] text-slate truncate">{task.location} • {task.urgency.category}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                            task.urgency.score >= 8 ? 'bg-red-50 text-danger' : 'bg-orange-50 text-orange-600'
                          }`}>
                            Score: {task.urgency.score}
                          </span>
                          {task.status === 'pending' ? (
                            <button
                              onClick={() => handleMatch(task.id)}
                              className="px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold hover:bg-blue-700"
                            >
                              Match
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-success flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Matched
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Part 3: AI Intelligence Card */}
              <section className="bento-card bento-insights">
                <h3 className="bento-card-title !text-white/70">AI Urgency Engine</h3>
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 border-4 border-white/20 border-t-white rounded-full flex items-center justify-center text-2xl font-bold mb-3">
                    {tasks.length > 0 ? (tasks.reduce((acc, t) => acc + t.urgency.score, 0) / tasks.length).toFixed(1) : '0.0'}
                  </div>
                  <p className="text-sm font-semibold">Avg. Crisis Index</p>
                  <p className="text-[10px] opacity-70 mt-3 max-w-[140px]">
                    Keywords: "Bleeding", "Water", "No food" driving priority logic.
                  </p>
                </div>
              </section>

              {/* Part 2: Simulation Map Card */}
              <section className="bento-card bento-map">
                <h3 className="bento-card-title">Deployment Heatmap</h3>
                <div className="relative flex-1">
                  <div className="absolute top-[40%] left-[20%] w-3 h-3 bg-danger rounded-full shadow-[0_0_0_4px_rgba(234,67,53,0.2)]" />
                  <div className="absolute top-[60%] left-[35%] w-3 h-3 bg-danger rounded-full shadow-[0_0_0_4px_rgba(234,67,53,0.2)]" />
                  <div className="absolute top-[30%] left-[75%] w-3 h-3 bg-warning rounded-full shadow-[0_0_0_4px_rgba(251,188,4,0.2)]" />
                  <div className="absolute top-[75%] left-[85%] w-3 h-3 bg-danger rounded-full shadow-[0_0_0_4px_rgba(234,67,53,0.2)]" />
                  <div className="absolute bottom-0 left-0 text-[10px] text-slate">
                    Simulated GPS active: 28.6139° N, 77.2090° E
                  </div>
                </div>
              </section>

              {/* Stats Card */}
              <section className="bento-card bento-stats">
                <div className="text-3xl font-bold text-primary">{tasks.length}</div>
                <div className="text-[11px] font-semibold text-slate uppercase tracking-wider">Verified Cases (Local)</div>
              </section>

              {/* Volunteer Status Card */}
              <section className="bento-card bento-volunteers">
                <h3 className="bento-card-title">Nearby Volunteers</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Sarah K.', role: 'Nurse', dist: '0.4km' },
                    { name: 'David R.', role: 'Driver', dist: '1.2km' },
                    { name: 'Anita M.', role: 'Civil', dist: '2.8km' },
                  ].map((v, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs">
                      <div className="w-6 h-6 bg-slate-200 rounded-full shrink-0" />
                      <span className="font-medium truncate">{v.name} ({v.role}) - {v.dist}</span>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {/* Survey View */}
          {screen === 'survey' && (
            <motion.div
              key="survey"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto py-12"
            >
              <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
                <div className="mb-8">
                  <h1 className="text-2xl font-bold mb-1">Field Intake Survey</h1>
                  <p className="text-slate text-sm">Verified ID: <span className="font-mono font-bold text-primary">{aadhaar}</span></p>
                </div>

                <form onSubmit={submitSurvey} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate">Full Name</label>
                      <input required name="name" defaultValue={ocrResult?.name || ''} className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate">Location</label>
                      <input disabled value="GPS Active (12.97° N, 77.59° E)" className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-slate" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate">Problem Category</label>
                      <select required name="manualCategory" defaultValue={ocrResult?.category || 'Medical'} className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none bg-white">
                        <option value="Medical">Medical</option>
                        <option value="Water">Water</option>
                        <option value="Food">Food</option>
                        <option value="Shelter">Shelter</option>
                        <option value="Sanitation">Sanitation</option>
                        <option value="Education">Education</option>
                        <option value="Training">Training</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate">Urgency Level (1-10)</label>
                      <select required name="manualUrgency" className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none bg-white">
                        {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(n => (
                          <option key={n} value={n}>{n} - {n >= 8 ? 'Critical' : n >= 5 ? 'Moderate' : 'Low'}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate">Description of Need</label>
                    <textarea required name="description" defaultValue={ocrResult?.description || ''} rows={3} className="w-full p-4 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none resize-none" placeholder="Explain the situation in detail..." />
                  </div>
                  <button type="submit" disabled={isAnalyzing} className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                    {isAnalyzing ? 'Processing...' : 'Save Locally & Transmit'}
                  </button>
                  <p className="text-[10px] text-center text-slate italic">AI analysis will run in background to refine priority scores.</p>
                </form>
              </div>
            </motion.div>
          )}

          {/* Success View */}
          {screen === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto py-20 text-center"
            >
              <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="text-success w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold mb-2">Request Transmitted</h2>
                <p className="text-slate text-sm mb-8">AI analysis complete. Your request is now live in the Command Center.</p>
                
                <div className="bg-bg p-4 rounded-xl mb-8">
                  <div className="text-[10px] font-bold uppercase text-slate mb-1">Assigned Urgency</div>
                  <div className="text-4xl font-black text-primary">{currentTask.urgency?.score}/10</div>
                </div>

                <button onClick={() => setScreen('dashboard')} className="w-full py-3 bg-ink text-white rounded-xl font-bold hover:bg-black transition-all">
                  Return to Dashboard
                </button>
              </div>
            </motion.div>
          )}

          {/* OCR Scanner View */}
          {screen === 'ocr' && (
            <motion.div
              key="ocr"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="max-w-xl mx-auto py-12"
            >
              <div className="bg-white rounded-3xl border border-border p-10 shadow-xl text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Scan className="text-primary w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Smart OCR Scanner</h2>
                <p className="text-slate text-sm mb-8">
                  Take a photo of a paper survey to automatically extract data using Google AI.
                </p>

                <div className="space-y-4">
                  <label className="block">
                    <div className={`w-full py-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${ocrLoading ? 'bg-slate-50 border-slate-200' : 'border-primary/30 hover:border-primary hover:bg-primary/5'}`}>
                      {ocrLoading ? (
                        <>
                          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                          <span className="text-sm font-bold text-primary">AI is reading the paper...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-10 h-10 text-primary" />
                          <span className="text-sm font-bold text-primary">Capture or Upload Survey</span>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      className="hidden" 
                      onChange={handleOCR}
                      disabled={ocrLoading}
                    />
                  </label>

                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2 justify-center">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  <div className="pt-6 border-t border-border mt-6">
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">Handwriting Recognition</div>
                        <div className="text-[10px] text-slate">Powered by Gemini Vision Engine</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Fallback for other screens */}
          {['volunteers', 'reports'].includes(screen) && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Activity className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-medium">Module coming soon...</p>
              <button onClick={() => setScreen('dashboard')} className="mt-4 text-primary text-sm font-bold">Back to Dashboard</button>
            </div>
          )}
          
          {/* Special case for Dialer screen if accessed from sidebar */}
          {screen === 'dialer' && (
            <div className="h-full flex items-center justify-center">
               <div className="w-80 bento-card shadow-xl">
                  <h3 className="bento-card-title">Offline Gatekeeper</h3>
                  <div className="bg-slate-100 p-3 rounded-lg font-mono text-center mb-4 text-sm tracking-widest">
                    {aadhaar ? aadhaar.replace(/(.{4})/g, '$1 ').trim() : '4291 5582 ****'}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => (
                      <button key={key} onClick={() => handleDial(key)} className="h-10 border border-border rounded-lg flex items-center justify-center font-semibold bg-bg hover:bg-slate-50">{key}</button>
                    ))}
                  </div>
                  <button onClick={verifyAadhaar} className="w-full py-3 bg-primary text-white rounded-lg font-bold">Verify & Start Survey</button>
               </div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
