
import React, { useState, useEffect, useMemo } from 'react';
import { Search, BookOpen, Layers, Target, Filter, ChevronRight, Check, CheckSquare, Square, ListChecks } from 'lucide-react';
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

  useEffect(() => {
    if (selectedSubject && selectedGrade) {
      const fetchLessons = async () => {
        const data = await apiService.getLessons(selectedSubject, selectedGrade);
        setLessons(data);
        setSelectedLessonIds([]);
      }
      fetchLessons();
    }
  }, [selectedSubject, selectedGrade]);

  useEffect(() => {
    if (selectedLessonIds.length > 0) {
      const fetchLOs = async () => {
        const data = await apiService.getLearningOutcomes(selectedLessonIds);
        setLearningOutcomes(data);
        setSelectedLoIds([]);
      }
      fetchLOs();
    } else {
      setLearningOutcomes([]);
      setSelectedLoIds([]);
    }
  }, [selectedLessonIds]);

  const toggleItem = (id: number, setter: React.Dispatch<React.SetStateAction<number[]>>) => {
    setter(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAllLessons = () => {
    if (selectedLessonIds.length === lessons.length) {
      setSelectedLessonIds([]);
    } else {
      setSelectedLessonIds(lessons.map(l => l.id));
    }
  };

  const toggleAllLOs = () => {
    if (selectedLoIds.length === learningOutcomes.length) {
      setSelectedLoIds([]);
    } else {
      setSelectedLoIds(learningOutcomes.map(lo => lo.id));
    }
  };

  const groupedLOs = useMemo(() => {
    const groups: Record<number, { lessonTitle: string, outcomes: LearningOutcome[] }> = {};
    
    selectedLessonIds.forEach(lessonId => {
      const lesson = lessons.find(l => l.id === lessonId);
      if (lesson) {
        groups[lessonId] = {
          lessonTitle: lesson.title,
          outcomes: learningOutcomes.filter(lo => lo.lesson_id === lessonId)
        };
      }
    });
    
    return groups;
  }, [selectedLessonIds, lessons, learningOutcomes]);

  const getSubjectColor = (subj: string) => {
    if (subj === 'Mathematics') return 'from-violet-600 to-indigo-700 shadow-violet-200';
    if (subj === 'Science') return 'from-emerald-500 to-teal-600 shadow-emerald-200';
    if (subj === 'English') return 'from-rose-500 to-pink-600 shadow-rose-200';
    if (subj === 'History') return 'from-amber-500 to-orange-600 shadow-amber-200';
    if (subj === 'Physics') return 'from-cyan-500 to-blue-600 shadow-cyan-200';
    if (subj === 'Chemistry') return 'from-orange-500 to-red-600 shadow-orange-200';
    if (subj === 'Biology') return 'from-green-500 to-emerald-600 shadow-green-200';
    return 'from-slate-700 to-slate-900 shadow-slate-200';
  }

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col h-full max-h-[calc(100vh-280px)]">
      <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
            <Filter className="text-indigo-600 w-4 h-4" />
          </div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Topic Selector</h2>
        </div>
      </div>
      
      <div className="p-5 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
              <div className="relative group">
                <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
                <select 
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full bg-slate-50 border-slate-100 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all cursor-pointer appearance-none"
                >
                  <option value="">Select Subject</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade</label>
              <div className="relative group">
                <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
                <select 
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full bg-slate-50 border-slate-100 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all cursor-pointer appearance-none"
                >
                  <option value="">Select Grade</option>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target Lessons</label>
              <div className="flex items-center gap-2">
                {lessons.length > 1 && (
                  <button 
                    onClick={toggleAllLessons}
                    className="text-[8px] font-black text-indigo-500 uppercase tracking-wider hover:underline"
                  >
                    {selectedLessonIds.length === lessons.length ? 'Clear All' : 'Select All'}
                  </button>
                )}
                {lessons.length > 0 && <span className="text-[9px] font-black text-slate-300">{lessons.length}</span>}
              </div>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {lessons.length > 0 ? lessons.map(l => (
                <button 
                  key={l.id} 
                  onClick={() => toggleItem(l.id, setSelectedLessonIds)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all border ${selectedLessonIds.includes(l.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'}`}
                >
                  <div className="shrink-0">{selectedLessonIds.includes(l.id) ? <CheckSquare size={14} /> : <Square size={14} className="text-slate-300" />}</div>
                  <span className="flex-1 break-words leading-tight">{l.title}</span>
                </button>
              )) : (
                <div className="py-6 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-100 flex flex-col items-center gap-2">
                  <BookOpen size={16} className="text-slate-300" />
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Set scope first</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Learning Outcomes</label>
              {learningOutcomes.length > 1 && (
                <button 
                  onClick={toggleAllLOs}
                  className="text-[8px] font-black text-indigo-500 uppercase tracking-wider hover:underline"
                >
                  {selectedLoIds.length === learningOutcomes.length ? 'Clear All' : 'Select All'}
                </button>
              )}
            </div>
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {Object.keys(groupedLOs).length > 0 ? Object.entries(groupedLOs).map(([lessonId, group]) => (
                <div key={lessonId} className="space-y-1.5">
                  <div className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-2 border border-slate-200">
                    <BookOpen size={10} className="text-slate-500" />
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest break-words flex-1 leading-tight">{group.lessonTitle}</span>
                  </div>
                  <div className="space-y-1 pl-2 border-l border-slate-100">
                    {group.outcomes.map(lo => (
                      <button 
                        key={lo.id} 
                        onClick={() => toggleItem(lo.id, setSelectedLoIds)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[10px] font-bold leading-normal transition-all border ${selectedLoIds.includes(lo.id) ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                      >
                        <div className={`shrink-0 w-3.5 h-3.5 rounded-lg border flex items-center justify-center transition-all ${selectedLoIds.includes(lo.id) ? 'bg-rose-600 border-rose-600 text-white shadow-sm shadow-rose-200' : 'bg-white border-slate-200'}`}>
                          {selectedLoIds.includes(lo.id) && <Check size={8} strokeWidth={3} />}
                        </div>
                        <span className="break-words">{lo.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )) : (
                <div className="py-6 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-100 flex flex-col items-center gap-2">
                   <Target size={16} className="text-slate-300" />
                   <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Awaiting lesson choice</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 border-t border-slate-100 bg-slate-50/30">
        <button 
          onClick={() => onScopeChange({ subject: selectedSubject, grade: selectedGrade, lessonIds: selectedLessonIds, loIds: selectedLoIds })}
          disabled={!selectedSubject || !selectedGrade}
          className={`w-full bg-gradient-to-tr ${getSubjectColor(selectedSubject)} text-white py-4 rounded-xl font-black text-xs uppercase tracking-[0.15em] hover:brightness-110 disabled:grayscale disabled:opacity-30 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3`}
        >
          <Search size={16} />
          Load Repository
        </button>
      </div>
    </div>
  );
};

export default SelectionPanel;
