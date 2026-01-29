
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  BookOpen, 
  Layers, 
  Target, 
  Filter, 
  ChevronDown, 
  ChevronRight, 
  Check, 
  CheckSquare, 
  Square, 
  PlusCircle, 
  MinusCircle,
  XCircle,
  ListChecks,
  Sparkles
} from 'lucide-react';
import { Lesson, LearningOutcome } from '../types';
import { apiService } from '../apiService';
import { SUBJECTS, GRADES } from '../constants';

interface Props {
  onScopeChange: (filters: { 
    subject: string; 
    grade: string; 
    lessonIds: number[]; 
    loIds: number[] 
  }) => void;
}

const SelectionPanel: React.FC<Props> = ({ onScopeChange }) => {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLessonIds, setSelectedLessonIds] = useState<number[]>([]);
  const [learningOutcomes, setLearningOutcomes] = useState<LearningOutcome[]>([]);
  const [selectedLoIds, setSelectedLoIds] = useState<number[]>([]);
  
  // State for expanded accordion lessons
  const [expandedLessonIds, setExpandedLessonIds] = useState<number[]>([]);

  useEffect(() => {
    if (selectedSubject && selectedGrade) {
      const fetchLessons = async () => {
        const data = await apiService.getLessons(selectedSubject, selectedGrade);
        setLessons(data);
        setSelectedLessonIds([]);
        setExpandedLessonIds([]);
      }
      fetchLessons();
    } else {
      setLessons([]);
      setSelectedLessonIds([]);
      setExpandedLessonIds([]);
    }
  }, [selectedSubject, selectedGrade]);

  useEffect(() => {
    if (lessons.length > 0) {
      const fetchLOs = async () => {
        const data = await apiService.getLearningOutcomes(lessons.map(l => l.id));
        setLearningOutcomes(data);
      }
      fetchLOs();
    } else {
      setLearningOutcomes([]);
      setSelectedLoIds([]);
    }
  }, [lessons]);

  const toggleLessonSelection = (id: number) => {
    const isSelected = selectedLessonIds.includes(id);
    const relatedLoIds = learningOutcomes.filter(lo => lo.lesson_id === id).map(lo => lo.id);
    
    if (isSelected) {
      setSelectedLessonIds(prev => prev.filter(i => i !== id));
      setSelectedLoIds(prev => prev.filter(loId => !relatedLoIds.includes(loId)));
    } else {
      setSelectedLessonIds(prev => [...prev, id]);
      setSelectedLoIds(prev => Array.from(new Set([...prev, ...relatedLoIds])));
    }
  };

  const toggleLoSelection = (loId: number, lessonId: number) => {
    const isLoSelected = selectedLoIds.includes(loId);
    let nextLoIds: number[];
    
    if (isLoSelected) {
      nextLoIds = selectedLoIds.filter(id => id !== loId);
    } else {
      nextLoIds = [...selectedLoIds, loId];
    }
    
    setSelectedLoIds(nextLoIds);
    
    const lessonLos = learningOutcomes.filter(lo => lo.lesson_id === lessonId).map(lo => lo.id);
    const anyLoSelectedInLesson = lessonLos.some(id => nextLoIds.includes(id));
    
    if (anyLoSelectedInLesson) {
      if (!selectedLessonIds.includes(lessonId)) {
        setSelectedLessonIds(prev => [...prev, lessonId]);
      }
    } else {
      setSelectedLessonIds(prev => prev.filter(id => id !== lessonId));
    }
  };

  const toggleExpandLesson = (id: number) => {
    setExpandedLessonIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allLessonIds = lessons.map(l => l.id);
    const allLoIds = learningOutcomes.map(lo => lo.id);
    setSelectedLessonIds(allLessonIds);
    setSelectedLoIds(allLoIds);
  };

  const handleClearAll = () => {
    setSelectedLessonIds([]);
    setSelectedLoIds([]);
  };

  const getSubjectColor = (subj: string) => {
    if (subj === 'Mathematics') return 'from-indigo-600 to-indigo-800 shadow-indigo-200';
    if (subj === 'Science') return 'from-emerald-600 to-emerald-800 shadow-emerald-200';
    if (subj === 'English') return 'from-rose-600 to-rose-800 shadow-rose-200';
    if (subj === 'History') return 'from-amber-600 to-amber-800 shadow-amber-200';
    if (subj === 'Physics') return 'from-cyan-600 to-cyan-800 shadow-cyan-200';
    if (subj === 'Chemistry') return 'from-orange-600 to-orange-800 shadow-orange-200';
    if (subj === 'Biology') return 'from-green-600 to-green-800 shadow-green-200';
    if (subj === 'Geography') return 'from-sky-600 to-sky-800 shadow-sky-200';
    return 'from-slate-700 to-slate-900 shadow-slate-200';
  }

  return (
    <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-[0_12px_40px_-10px_rgba(0,0,0,0.3)] border-4 border-slate-400 overflow-hidden flex flex-col h-[calc(100vh-100px)] md:h-[calc(100vh-140px)] relative">
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-slate-100 to-transparent pointer-events-none"></div>
      
      <div className="bg-slate-100/80 px-4 md:px-6 py-4 md:py-5 border-b-4 border-slate-400 space-y-3 md:space-y-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white border-2 border-slate-400 flex items-center justify-center shadow-md">
            <Filter className="text-indigo-700 w-4 h-4 md:w-5 md:h-5" strokeWidth={3} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-base md:text-lg font-black text-slate-900 tracking-tight leading-none">Topic Selector</h2>
            <span className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">Scope Calibration</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 md:gap-3">
          <div className="space-y-1">
            <label className="text-[8px] md:text-[9px] font-black text-slate-700 uppercase tracking-widest ml-1">Academic Subject</label>
            <div className="relative group">
              <select 
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-white border-2 border-slate-400 rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-[10px] md:text-[11px] font-black text-slate-800 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer shadow-sm appearance-none group-hover:border-slate-600"
              >
                <option value="">Select Subject</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                <ChevronDown size={14} strokeWidth={3} />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[8px] md:text-[9px] font-black text-slate-700 uppercase tracking-widest ml-1">Grade Level</label>
            <div className="relative group">
              <select 
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full bg-white border-2 border-slate-400 rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-[10px] md:text-[11px] font-black text-slate-800 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer shadow-sm appearance-none group-hover:border-slate-600"
              >
                <option value="">Select Grade</option>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                <ChevronDown size={14} strokeWidth={3} />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#fdfdfd] relative z-10">
        <div className="p-3 md:p-4 space-y-2">
          <div className="flex items-center justify-between mb-3 px-1 sticky top-0 bg-[#fdfdfd]/95 backdrop-blur-sm py-1 z-20 border-b-2 border-slate-200">
            <label className="text-[9px] md:text-[10px] font-black text-slate-700 uppercase tracking-[0.1em] flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
              Curriculum Map
            </label>
            {lessons.length > 0 && (
              <div className="flex gap-2 md:gap-3 items-center">
                <button 
                  onClick={handleSelectAll}
                  className="text-[8px] md:text-[9px] font-black text-indigo-700 uppercase tracking-widest hover:text-indigo-900 transition-all flex items-center gap-1 active:scale-95"
                >
                  <CheckSquare size={10} strokeWidth={3} /> All
                </button>
                <button 
                  onClick={handleClearAll}
                  className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-rose-600 transition-all flex items-center gap-1 active:scale-95"
                >
                  <XCircle size={10} strokeWidth={3} /> Clear
                </button>
              </div>
            )}
          </div>

          {lessons.length > 0 ? (
            lessons.map(lesson => {
              const isExpanded = expandedLessonIds.includes(lesson.id);
              const isSelected = selectedLessonIds.includes(lesson.id);
              const lessonLOs = learningOutcomes.filter(lo => lo.lesson_id === lesson.id);
              const selectedCount = lessonLOs.filter(lo => selectedLoIds.includes(lo.id)).length;
              const allSelected = selectedCount === lessonLOs.length && lessonLOs.length > 0;
              
              return (
                <div key={lesson.id} className="mb-1">
                  <div 
                    onClick={() => toggleExpandLesson(lesson.id)}
                    className={`w-full group flex items-center gap-3 px-3 py-2 md:py-2.5 rounded-xl text-left transition-all border-2 cursor-pointer ${isExpanded ? 'bg-indigo-50/50 border-indigo-400 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-400 shadow-sm'}`}
                  >
                    <div 
                      onClick={(e) => { e.stopPropagation(); toggleLessonSelection(lesson.id); }}
                      className={`shrink-0 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-700 border-indigo-700 text-white shadow-md' : 'bg-white border-slate-400 hover:border-indigo-600'}`}
                    >
                      {isSelected && (allSelected ? <Check size={12} strokeWidth={4} /> : <div className="w-2 h-0.5 bg-white rounded-full" />)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <span className={`text-[10px] md:text-[11px] font-black leading-tight block transition-colors truncate ${isExpanded ? 'text-indigo-900' : 'text-slate-800'}`}>
                        {lesson.title}
                      </span>
                      {selectedCount > 0 && (
                         <span className="text-[7px] md:text-[8px] font-black text-indigo-700 uppercase mt-0.5 block flex items-center gap-1">
                           <Sparkles size={8} className="fill-indigo-600" />
                           {selectedCount} Selected
                         </span>
                      )}
                    </div>

                    <div className={`p-1 rounded-lg transition-all border ${isExpanded ? 'bg-indigo-100 text-indigo-700 rotate-180 border-indigo-200' : 'text-slate-500 bg-slate-50 border-slate-200'}`}>
                      <ChevronDown size={12} strokeWidth={3} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-1 ml-4 md:ml-6 space-y-1 border-l-2 border-indigo-300 pl-3 animate-in slide-in-from-top-2 duration-200">
                      {lessonLOs.map(lo => {
                        const isLoSelected = selectedLoIds.includes(lo.id);
                        return (
                          <div 
                            key={lo.id}
                            onClick={() => toggleLoSelection(lo.id, lesson.id)}
                            className={`flex items-center gap-3 px-3 py-1.5 md:py-2 rounded-xl text-left cursor-pointer transition-all border-2 ${isLoSelected ? 'bg-indigo-50 border-indigo-300 text-indigo-950' : 'bg-transparent border-transparent hover:bg-slate-100 text-slate-700'}`}
                          >
                             <div className={`shrink-0 w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${isLoSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-400'}`}>
                              {isLoSelected && <Check size={10} strokeWidth={4} />}
                            </div>
                            <span className="text-[9px] md:text-[10px] font-bold leading-tight">{lo.description}</span>
                          </div>
                        );
                      })}
                      {lessonLOs.length === 0 && (
                        <div className="px-4 py-2 text-[8px] md:text-[9px] font-black text-slate-600 italic uppercase tracking-widest text-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-100/50">Pool Empty</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-16 md:py-24 text-center flex flex-col items-center gap-4 opacity-100">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white border-2 border-slate-400 rounded-2xl flex items-center justify-center shadow-lg">
                <BookOpen size={24} className="text-slate-500" />
              </div>
              <p className="text-[8px] md:text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] text-center px-6 md:px-10 leading-loose">Calibrate subject & grade to reveal curriculum</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 md:p-5 border-t-4 border-slate-400 bg-slate-100 relative z-10">
        <button 
          onClick={() => onScopeChange({ subject: selectedSubject, grade: selectedGrade, lessonIds: selectedLessonIds, loIds: selectedLoIds })}
          disabled={!selectedSubject || !selectedGrade}
          className={`w-full bg-gradient-to-tr ${getSubjectColor(selectedSubject)} text-white py-3 md:py-4 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-[0.2em] hover:brightness-110 active:scale-[0.98] disabled:grayscale disabled:opacity-30 transition-all shadow-[0_8px_30px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2 md:gap-3 shrink-0 whitespace-nowrap group border-2 border-white/20`}
        >
          <Search size={18} className="group-hover:rotate-12 transition-transform" strokeWidth={3} />
          Sync Content
        </button>
      </div>
    </div>
  );
};

export default SelectionPanel;
