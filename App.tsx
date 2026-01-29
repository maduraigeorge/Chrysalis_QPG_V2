
import React, { useState, useEffect } from 'react';
import { 
  Settings,
  X,
  Lock,
  ArrowLeft,
  Smartphone,
  Database,
  FileText,
  // DO: replace non-existent Butterfly icon with Sparkles
  Sparkles,
  ChevronRight,
  User,
  Printer,
  ChevronDown,
  Download,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  Palette,
  UserCheck,
  ShieldAlert,
  Filter
} from 'lucide-react';
import { AppMode, Question, PaperMetadata, Section, UserRole } from './types';
import SelectionPanel from './components/SelectionPanel';
import QuestionListing from './components/QuestionListing';
import QuestionPaperCreator from './components/QuestionPaperCreator';
import PaperPreview from './components/PaperPreview';
import AdminPanel from './components/AdminPanel';
import { apiService } from './apiService';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.BANK);
  const [role, setRole] = useState<UserRole>(UserRole.TEACHER);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbInitializing, setDbInitializing] = useState(true);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [lastFilters, setLastFilters] = useState<{ subject: string; grade: string; lessonIds: number[]; loIds: number[] } | null>(null);
  const [showWorkbench, setShowWorkbench] = useState(true);
  
  // UI States
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [paperMetadata, setPaperMetadata] = useState<PaperMetadata>({
    title: 'Semester Final Examination',
    subject: '',
    grade: '',
    totalMarks: 50,
    duration: '2 Hours',
    instructions: '1. All questions are compulsory.\n2. Use of calculators is permitted where specified.',
    schoolName: 'Greenwood International School',
    schoolLogo: ''
  });
  
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        await apiService.initDatabase();
      } catch (e) {
        console.error("DB Initialization failed", e);
      } finally {
        setDbInitializing(false);
      }
    };
    init();
  }, []);

  const handleScopeChange = async (filters: { subject: string; grade: string; lessonIds: number[]; loIds: number[] }) => {
    setLoading(true);
    setLastFilters(filters);
    try {
      const data = await apiService.getQuestions(filters);
      setQuestions(data);
      setSelectedQuestionIds(data.map(q => q.id));
      setPaperMetadata(prev => ({ ...prev, subject: filters.subject, grade: filters.grade }));
    } catch (error) {
      console.error("Failed to fetch questions", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshQuestions = async () => {
    if (lastFilters) {
      const data = await apiService.getQuestions(lastFilters);
      setQuestions(data);
    }
  };

  const toggleQuestionSelection = (id: number) => {
    setSelectedQuestionIds(prev => 
      prev.includes(id) ? prev.filter(qid => qid !== id) : [...prev, id]
    );
  };

  const setBulkQuestionSelection = (ids: number[], select: boolean) => {
    if (select) {
      setSelectedQuestionIds(prev => Array.from(new Set([...prev, ...ids])));
    } else {
      setSelectedQuestionIds(prev => prev.filter(id => !ids.includes(id)));
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.username === 'Admin' && loginForm.password === 'Reset@123') {
      setRole(UserRole.ADMIN);
      setShowAdminLogin(false);
      setMode(AppMode.ADMIN);
      setIsMenuOpen(false);
      setLoginError('');
      setLoginForm({ username: '', password: '' });
    } else {
      setLoginError('Invalid credentials.');
    }
  };

  const logout = () => {
    setRole(UserRole.TEACHER);
    setMode(AppMode.BANK);
    setIsMenuOpen(false);
    window.location.reload();
  };

  if (dbInitializing) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-black text-center">
        <div className="flex flex-col items-center gap-6">
          <Database size={64} className="text-indigo-400 animate-pulse" />
          <h1 className="text-2xl">Initializing Chrysalis Core...</h1>
        </div>
      </div>
    );
  }

  const isPaperMode = mode === AppMode.PAPER;
  const isBankMode = mode === AppMode.BANK;

  return (
    <div className="min-h-screen bg-[#fcfdff] flex flex-col selection:bg-indigo-100 relative">
      <div className="fixed inset-0 -z-10 opacity-30 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-300 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rose-200 rounded-full blur-[120px] animate-bounce duration-[10000ms]"></div>
      </div>

      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-[60] no-print h-20 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => { setMode(AppMode.BANK); setQuestions([]); }}>
            <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100 group-hover:scale-110 transition-transform">
              {/* DO: replace non-existent Butterfly icon with Sparkles */}
              <Sparkles className="text-white w-7 h-7" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-900 leading-none">Chrysalis</span>
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1.5">QP Generator</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-1.5 rounded-2xl shadow-inner">
            <button 
              onClick={() => setMode(AppMode.BANK)}
              className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${mode === AppMode.BANK ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <FileText size={16} /> Question Bank
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button 
              onClick={() => setMode(AppMode.PAPER)}
              className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${mode === AppMode.PAPER ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <LayoutDashboard size={16} /> Question Paper
            </button>
            {role === UserRole.ADMIN && (
              <>
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                <button 
                  onClick={() => setMode(AppMode.ADMIN)}
                  className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${mode === AppMode.ADMIN ? 'bg-white text-rose-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <ShieldAlert size={16} /> Admin Console
                </button>
              </>
            )}
          </div>

          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`flex items-center gap-4 bg-white border py-2 pl-2 pr-5 rounded-2xl shadow-sm hover:shadow-md transition-all ${isMenuOpen ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-slate-100'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg bg-gradient-to-br ${role === UserRole.ADMIN ? 'from-rose-500 to-orange-500 shadow-rose-100' : 'from-indigo-500 to-purple-500 shadow-indigo-100'}`}>
                {role === UserRole.ADMIN ? 'AD' : 'TR'}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-black text-slate-800">{role === UserRole.ADMIN ? 'Admin' : 'Teacher Pro'}</span>
                <span className="text-[10px] font-bold text-slate-400">Account</span>
              </div>
              <ChevronDown size={14} className={`text-slate-300 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMenuOpen && (
              <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-slate-50 p-4 animate-in fade-in slide-in-from-top-4 duration-300 z-[70]">
                <div className="space-y-1">
                  {role === UserRole.TEACHER ? (
                    <button 
                      onClick={() => { setShowAdminLogin(true); setIsMenuOpen(false); }} 
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all font-bold text-xs"
                    >
                      <ShieldCheck size={18} /> Admin Verification
                    </button>
                  ) : (
                    <button 
                      onClick={() => { setRole(UserRole.TEACHER); setMode(AppMode.BANK); setIsMenuOpen(false); }} 
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all font-bold text-xs"
                    >
                      <UserCheck size={18} /> Switch to Teacher
                    </button>
                  )}
                  {/* DO: add comment above each fix. */}
                  {/* Fix: use onClick instead of non-existent logout prop for button element */}
                  <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all font-bold text-xs">
                    <LogOut size={18} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-[1600px] mx-auto w-full px-8 py-10 no-print flex gap-10 pb-56">
        {mode === AppMode.ADMIN ? (
          <div className="w-full"><AdminPanel /></div>
        ) : (
          <>
            {isBankMode && (
              <aside className="w-[380px] shrink-0 sticky top-28 h-fit">
                <SelectionPanel onScopeChange={handleScopeChange} />
              </aside>
            )}

            <section className={`flex-1 min-w-0 ${isPaperMode ? 'max-w-5xl mx-auto w-full' : ''}`}>
              <div className="space-y-10">
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                      {mode === AppMode.BANK ? 'Question Bank' : 'Paper Designer'}
                    </h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">
                      {mode === AppMode.BANK ? 'Curate Academic Content' : 'Structure High-Fidelity Exams'}
                    </p>
                  </div>
                  
                  {isPaperMode && (
                    <button 
                      onClick={() => setMode(AppMode.BANK)}
                      className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-white border border-indigo-100 px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-indigo-50 transition-all"
                    >
                      <ArrowLeft size={14} /> Return to Bank
                    </button>
                  )}
                </div>

                {mode === AppMode.BANK ? (
                  <QuestionListing 
                    questions={questions} 
                    loading={loading}
                    selectedIds={selectedQuestionIds}
                    onToggle={toggleQuestionSelection}
                    onToggleAll={setBulkQuestionSelection}
                    metadata={paperMetadata}
                    onDesignPaper={() => setMode(AppMode.PAPER)}
                  />
                ) : (
                  <QuestionPaperCreator 
                    questions={questions}
                    metadata={paperMetadata}
                    onMetadataChange={setPaperMetadata}
                    sections={sections}
                    onSectionsChange={setSections}
                    onRefreshQuestions={refreshQuestions}
                  />
                )}
              </div>
            </section>
          </>
        )}
      </main>

      {showAdminLogin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-slate-900 p-12 text-white relative text-center">
              <button onClick={() => setShowAdminLogin(false)} className="absolute top-8 right-8 hover:bg-white/20 p-2 rounded-full transition-colors"><X size={20} /></button>
              <div className="w-20 h-20 bg-indigo-500 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-xl shadow-indigo-500/20"><Lock size={40} /></div>
              <h2 className="text-3xl font-black">Authorized Only</h2>
              <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-[10px]">Credential verification required</p>
            </div>
            <form onSubmit={handleAdminLogin} className="p-12 space-y-8">
              {loginError && <div className="bg-rose-50 text-rose-600 p-5 rounded-2xl text-xs font-black border border-rose-100 uppercase tracking-widest">{loginError}</div>}
              <div className="space-y-4">
                <input type="text" autoFocus required value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} className="w-full bg-slate-50 border-transparent rounded-2xl px-6 py-4.5 font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 border border-slate-100 transition-all" placeholder="Username" />
                <input type="password" required value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full bg-slate-50 border-transparent rounded-2xl px-6 py-4.5 font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 border border-slate-100 transition-all" placeholder="Password" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all text-xs">Unlock Registry</button>
            </form>
          </div>
        </div>
      )}

      <div className="print-only">
        <PaperPreview mode={mode} metadata={paperMetadata} sections={sections} questions={questions} selectedBankQuestionIds={selectedQuestionIds} />
      </div>
    </div>
  );
};

export default App;
