
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Check, 
  HelpCircle, 
  Star, 
  Layers, 
  Tag, 
  ChevronDown, 
  ListChecks, 
  FileDown, 
  Target, 
  FileText, 
  LayoutDashboard,
  ChevronUp, 
  FileSpreadsheet, 
  Printer,
  ChevronRight,
  Key,
  Database,
  Square,
  CheckSquare,
  MinusSquare,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Question, PaperMetadata } from '../types';
import { exportBankToWord } from '../utils/DocxExporter';
import { exportBankToRtf } from '../utils/RtfExporter';
import saveAs from 'file-saver';

interface Props {
  questions: Question[];
  loading: boolean;
  selectedIds: number[];
  onToggle: (id: number) => void;
  onToggleAll: (ids: number[], select: boolean) => void;
  metadata: PaperMetadata;
  onDesignPaper?: () => void;
  onOpenSelector?: () => void;
  isSelectorMinimized?: boolean;
}

const cleanText = (text: string) => {
  return text.replace(/^\[item[_\- ]?\d+\]\s*/i, '').replace(/\s*\[Set \d+\-\d+\]$/i, '').trim();
};

export default function QuestionListing({ 
  questions, 
  loading, 
  selectedIds, 
  onToggle, 
  onToggleAll, 
  metadata, 
  onDesignPaper, 
  onOpenSelector,
  isSelectorMinimized 
}: Props): React.ReactElement {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Sorting states
  const [currentSort, setCurrentSort] = useState<'default' | 'difficulty-asc' | 'difficulty-desc' | 'lesson-asc' | 'lesson-desc'>('default');
  
  // Filtering states
  const [activeFilters, setActiveFilters] = useState({ type: '', marks: '', lesson: '', difficulty: '' });
  const [appliedFilters, setAppliedFilters] = useState({ type: '', marks: '', lesson: '', difficulty: '' });

  const loadingSkeletonItems: number[] = [1, 2, 3];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) setIsExportMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { availableTypes, availableMarks, availableLessons } = useMemo(() => {
    const types = [...new Set(questions.map(q => q.question_type))];
    // DO: add comment above each fix.
    // Fix: Explicitly type sort function parameters as numbers to resolve arithmetic operation error.
    const marks = [...new Set(questions.map(q => q.marks))].sort((a: number, b: number) => a - b);
    const lessonMap = new Map<number, string>();
    questions.forEach(q => {
      if (q.lesson_id && q.lesson_title && !lessonMap.has(q.lesson_id)) {
        lessonMap.set(q.lesson_id, q.lesson_title);
      }
    });
    const lessons = Array.from(lessonMap, ([id, title]) => ({ id, title }));
    return { availableTypes: types, availableMarks: marks, availableLessons: lessons };
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const typeMatch = !appliedFilters.type || q.question_type === appliedFilters.type;
      const marksMatch = !appliedFilters.marks || q.marks === Number(appliedFilters.marks);
      const lessonMatch = !appliedFilters.lesson || q.lesson_id === Number(appliedFilters.lesson);
      const difficultyMatch = !appliedFilters.difficulty || q.difficulty === Number(appliedFilters.difficulty);
      return typeMatch && marksMatch && lessonMatch && difficultyMatch;
    });
  }, [questions, appliedFilters]);

  const groupedQuestions = useMemo(() => {
    const groups: Record<number, Record<string, Question[]>> = {};
    filteredQuestions.forEach(q => {
      if (!groups[q.marks]) groups[q.marks] = {};
      if (!groups[q.marks][q.question_type]) groups[q.marks][q.question_type] = [];
      groups[q.marks][q.question_type].push(q);
    });

    for (const marksKey in groups) {
      for (const typeKey in groups[marksKey]) {
        groups[marksKey][typeKey].sort((a, b) => {
          switch (currentSort) {
            case 'difficulty-asc':
              return a.difficulty - b.difficulty;
            case 'difficulty-desc':
              return b.difficulty - a.difficulty;
            case 'lesson-asc':
              return (a.lesson_title || '').localeCompare(b.lesson_title || '');
            case 'lesson-desc':
              return (b.lesson_title || '').localeCompare(a.lesson_title || '');
            default:
              return 0;
          }
        });
      }
    }
    return groups;
  }, [filteredQuestions, currentSort]);

  const sortedMarks = useMemo<number[]>(() => {
    return (Object.keys(groupedQuestions) as string[]).map(Number).sort((a, b) => a - b);
  }, [groupedQuestions]);

  const allSelected = questions.length > 0 && selectedIds.length === questions.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < questions.length;

  const handleBulkToggle = () => {
    const shouldSelectAll = !allSelected;
    onToggleAll(questions.map(q => q.id), shouldSelectAll);
  };
  
  const handleApplyFilters = () => {
    setAppliedFilters(activeFilters);
  };

  const handleResetFilters = () => {
    setActiveFilters({ type: '', marks: '', lesson: '', difficulty: '' });
    setAppliedFilters({ type: '', marks: '', lesson: '', difficulty: '' });
  };

  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length;

  const handleDesignPaperClick = () => {
    if (selectedIds.length < 5) {
      const confirmProceed = window.confirm(
        `Warning: You have selected only ${selectedIds.length} question(s). \n\nA balanced Question Paper typically requires at least 5 questions for proper structural distribution. \n\nDo you want to proceed to the Paper Designer anyway?`
      );
      if (!confirmProceed) return;
    }
    onDesignPaper?.();
  };

  const handleExportWord = () => {
    const selected: Question[] = questions.filter(q => selectedIds.includes(q.id));
    if (selected.length === 0) return;
    exportBankToWord(selected, metadata);
    setIsExportMenuOpen(false);
  };

  const handleExportRtf = () => {
    const selected: Question[] = questions.filter(q => selectedIds.includes(q.id));
    if (selected.length === 0) return;
    exportBankToRtf(selected, metadata);
    setIsExportMenuOpen(false);
  };

  const handleExportExcel = () => {
    const selected: Question[] = questions.filter(q => selectedIds.includes(q.id));
    if (selected.length === 0) return;
    
    const headers = ['ID', 'Marks', 'Type', 'Question', 'Answer Key', 'Lesson', 'Learning Outcome', 'Difficulty'];
    // DO: add comment above each fix.
    // Fix: Explicitly type 'rows' as an array of arrays of strings/numbers to prevent it from being inferred as 'unknown'.
    const rows: (string | number)[][] = selected.map(q => [
      q.id,
      q.marks,
      q.question_type,
      `"${cleanText(q.question_text).replace(/"/g, '""')}"`,
      `"${(q.answer_key || '').replace(/"/g, '""')}"`,
      `"${(q.lesson_title || '').replace(/"/g, '""')}"`,
      `"${(q.lo_description || '').replace(/"/g, '""')}"`,
      q.difficulty === 1 ? 'Basic' : q.difficulty === 2 ? 'Medium' : 'Hard'
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `Question_Bank_${metadata.subject}_${metadata.grade}.csv`);
    setIsExportMenuOpen(false);
  };

  const getMarkColor = (marks: number) => {
    if (marks <= 1) return 'bg-emerald-700 shadow-sm';
    if (marks <= 3) return 'bg-sky-700 shadow-sm';
    if (marks <= 5) return 'bg-indigo-700 shadow-sm';
    return 'bg-purple-800 shadow-sm';
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {loadingSkeletonItems.map(i => (
          <div key={i} className="bg-white p-4 md:p-6 rounded-2xl border-2 border-slate-300 animate-pulse flex gap-3 md:gap-5">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-100 rounded-xl shrink-0"></div>
            <div className="flex-1 space-y-3">
              <div className="h-3 w-1/4 bg-slate-100 rounded-lg"></div>
              <div className="h-3 w-full bg-slate-100 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border-4 border-dashed border-slate-400 py-16 md:py-24 text-center shadow-2xl relative overflow-hidden px-6">
        <div className="bg-slate-50 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border-2 border-slate-400">
          <HelpCircle className="text-slate-500 w-10 h-10" />
        </div>
        <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">Question Bank Silent</h3>
        <p className="text-slate-600 font-bold max-w-sm mx-auto mt-3 uppercase text-[8px] md:text-[9px] tracking-[0.2em] leading-relaxed">
          Sync your Topic Selector to populate the curriculum repository.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-40 relative">
      <div className="sticky top-[64px] md:top-[80px] z-50 bg-white/95 backdrop-blur-md px-3 md:px-8 py-2 md:py-3 rounded-2xl border-2 border-slate-500 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.3)] flex items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-700 shadow-sm border border-indigo-100 shrink-0">
             <Database size={18} className="md:w-5 md:h-5" strokeWidth={3} />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xs md:text-sm lg:text-base font-black text-slate-900 tracking-tight leading-tight">Question Bank</h1>
            <p className="hidden xs:flex text-slate-500 font-black text-[7px] md:text-[8px] uppercase tracking-[0.2em] items-center gap-1.5">
              <span className="w-1 h-1 bg-indigo-500 rounded-full"></span>
              Inventory Results
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {isSelectorMinimized && (
            <button 
              onClick={onOpenSelector}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-xl bg-indigo-700 text-white font-black text-[8px] md:text-[10px] uppercase tracking-widest hover:brightness-110 transition-all shadow-lg active:scale-95 animate-in fade-in slide-in-from-right-4 duration-500"
            >
              <Filter size={14} strokeWidth={3} />
              <span className="hidden sm:inline">Expand Topics</span>
              <span className="sm:hidden">Topics</span>
            </button>
          )}

          <div className="hidden sm:block h-6 w-0.5 bg-slate-200"></div>
          
          <button 
            onClick={handleBulkToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all border-2 font-black text-[9px] uppercase tracking-widest active:scale-95 shadow-sm 
            ${allSelected ? 'bg-indigo-700 text-white border-indigo-700' : someSelected ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-500'}`}
          >
            {allSelected ? (
              <CheckSquare size={13} strokeWidth={3} />
            ) : someSelected ? (
              <MinusSquare size={13} strokeWidth={3} />
            ) : (
              <Square size={13} strokeWidth={3} />
            )}
            <span>{allSelected ? 'Unselect All' : 'Select All'}</span>
          </button>
        </div>
      </div>

      {/* Horizontal Control Bar */}
      <div className="bg-white/80 backdrop-blur-sm p-3 rounded-2xl border-2 border-slate-300 shadow-md">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
          {/* Filter controls */}
          <div className="flex-grow space-y-1.5 min-w-[100px]">
            <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">Type</label>
            <select value={activeFilters.type} onChange={e => setActiveFilters(f => ({...f, type: e.target.value}))} className="w-full bg-slate-50 border-2 border-slate-300 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-800 shadow-inner">
              <option value="">All</option>
              {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex-grow space-y-1.5 min-w-[100px]">
            <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">Marks</label>
            <select value={activeFilters.marks} onChange={e => setActiveFilters(f => ({...f, marks: e.target.value}))} className="w-full bg-slate-50 border-2 border-slate-300 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-800 shadow-inner">
              <option value="">All</option>
              {availableMarks.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex-grow space-y-1.5 min-w-[100px]">
            <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">Difficulty</label>
            <select value={activeFilters.difficulty} onChange={e => setActiveFilters(f => ({...f, difficulty: e.target.value}))} className="w-full bg-slate-50 border-2 border-slate-300 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-800 shadow-inner">
              <option value="">All</option>
              <option value="1">Basic</option>
              <option value="2">Medium</option>
              <option value="3">Hard</option>
            </select>
          </div>
          <div className="flex-grow space-y-1.5 basis-[200px]">
            <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">Lesson</label>
            <select value={activeFilters.lesson} onChange={e => setActiveFilters(f => ({...f, lesson: e.target.value}))} className="w-full bg-slate-50 border-2 border-slate-300 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-800 shadow-inner">
              <option value="">All</option>
              {availableLessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </div>
          <div className="flex-grow space-y-1.5 min-w-[150px]">
            <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">Sort By</label>
            <select 
              value={currentSort} 
              onChange={e => setCurrentSort(e.target.value as any)} 
              className="w-full bg-slate-50 border-2 border-slate-300 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-800 shadow-inner"
            >
              <option value="default">Default Order</option>
              <option value="difficulty-asc">Difficulty: Low to High</option>
              <option value="difficulty-desc">Difficulty: High to Low</option>
              <option value="lesson-asc">Lesson: A-Z</option>
              <option value="lesson-desc">Lesson: Z-A</option>
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={handleApplyFilters} className="flex items-center justify-center gap-2 bg-indigo-700 text-white px-3 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-95 border-2 border-indigo-500">
              <Filter size={12} strokeWidth={3}/> Apply
            </button>
            <button onClick={handleResetFilters} className="p-2 bg-white text-slate-600 rounded-lg border-2 border-slate-300 hover:bg-slate-50 active:scale-95 shadow-md" title="Reset Filters">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>


      <div className="pt-2">
        {sortedMarks.map(marks => (
          <div key={marks} className="space-y-4 mb-8 md:mb-12 last:mb-0">
            <div className="flex items-center gap-3 px-1">
               <div className={`text-white px-4 md:px-5 py-1.5 md:py-2 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest shadow-lg border-2 border-white/20 ${getMarkColor(marks)}`}>
                 {marks} Mark Weight
               </div>
               <div className="h-[2px] flex-1 bg-slate-400"></div>
            </div>
            
            <div className="space-y-4 md:space-y-6">
              {Object.entries(groupedQuestions[marks]).map(([type, items]) => (
                <div key={type} className="space-y-3 ml-1 md:ml-2 border-l-4 border-slate-400 pl-4 md:pl-6 relative">
                  <div className="absolute top-0 -left-1.5 w-3 h-3 bg-white border-2 border-slate-600 rounded-full"></div>
                  
                  <div className="flex items-center gap-2 mb-3 md:mb-4 bg-white border-2 border-slate-300 rounded-lg px-2.5 md:px-3 py-1 md:py-1.5 w-fit shadow-sm">
                     <Tag size={10} className="text-indigo-700" strokeWidth={3} />
                     <h4 className="text-[8px] md:text-[9px] font-black text-slate-900 uppercase tracking-widest">{type} Inventory</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {items.map(q => (
                      <div 
                        key={q.id} 
                        className={`group relative bg-white px-3 md:px-4 py-3 md:py-4 rounded-xl md:rounded-2xl border-2 transition-all cursor-pointer ${selectedIds.includes(q.id) ? 'border-indigo-600 bg-indigo-50/40 shadow-[0_8px_30px_rgb(79,70,229,0.2)] scale-[1.005]' : 'border-slate-300 hover:border-slate-500 shadow-sm'}`}
                        onClick={() => onToggle(q.id)}
                      >
                        <div className="flex gap-3 md:gap-4 items-start">
                          <div className={`w-6 h-6 md:w-7 md:h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all mt-0.5 
                          ${selectedIds.includes(q.id) ? 'bg-indigo-700 border-indigo-700 text-white shadow-sm' : 'bg-white border-slate-400 group-hover:border-indigo-500'}`}>
                            {selectedIds.includes(q.id) && <Check size={14} strokeWidth={3} />}
                          </div>
                          
                          <div className="flex-1 space-y-3 md:space-y-4">
                            <div>
                              <p className={`text-xs md:text-sm font-bold leading-relaxed pr-6 ${selectedIds.includes(q.id) ? 'text-indigo-950' : 'text-slate-900'}`}>
                                {cleanText(q.question_text)}
                              </p>
                            </div>

                            {q.answer_key && (
                              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl px-3 md:px-4 py-2 md:py-3 flex items-start gap-2 md:gap-3 shadow-inner">
                                <Key size={14} className="text-emerald-700 mt-0.5 shrink-0" strokeWidth={3} />
                                <div className="flex flex-col">
                                  <span className="text-[7px] md:text-[9px] font-black text-emerald-800 uppercase tracking-widest mb-0.5">Solution Key</span>
                                  <p className="text-[10px] md:text-xs font-bold text-emerald-950 leading-normal">{q.answer_key}</p>
                                </div>
                              </div>
                            )}
                            
                            {q.image_url && (
                              <div className="mt-2 w-full max-w-lg rounded-xl overflow-hidden border-2 border-slate-300 bg-white p-1 md:p-2 shadow-md">
                                <img src={q.image_url} alt="Question Resource" className="w-full h-auto object-contain max-h-[180px] md:max-h-[250px] rounded-lg" />
                              </div>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-1.5 md:gap-2 pt-1">
                              <div className="flex items-center gap-1 bg-slate-100 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[7px] md:text-[8px] font-black text-slate-800 uppercase tracking-widest border-2 border-slate-300 shadow-sm">
                                <Layers size={9} strokeWidth={3} />
                                <span className="max-w-[120px] md:max-w-[150px] truncate">{q.lesson_title || 'General'}</span>
                              </div>
                              {q.lo_description && (
                                <div className="flex items-center gap-1 bg-rose-50 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[7px] md:text-[8px] font-black text-rose-800 uppercase tracking-widest border-2 border-rose-300 shadow-sm">
                                  <Target size={9} strokeWidth={3} />
                                  <span className="max-w-[140px] md:max-w-[180px] truncate">{q.lo_description}</span>
                                </div>
                              )}
                              <div className={`flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[7px] md:text-[8px] font-black uppercase tracking-widest border-2 shadow-sm ${q.difficulty === 1 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : q.difficulty === 2 ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-rose-50 text-rose-800 border-rose-300'}`}>
                                <Star size={9} fill="currentColor" strokeWidth={3} />
                                {q.difficulty === 1 ? 'Basic' : q.difficulty === 2 ? 'Medium' : 'Hard'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filteredQuestions.length === 0 && activeFilterCount > 0 && (
           <div className="text-center py-16">
             <div className="w-16 h-16 bg-white border-4 border-dashed border-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
               <Filter size={32} className="text-slate-400" />
             </div>
             <h4 className="text-lg font-black text-slate-700">No Matches Found</h4>
             <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Try adjusting your filters</p>
           </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-slate-500 py-3 md:py-3 z-[100] flex justify-center no-print shadow-[0_-15px_50px_rgba(0,0,0,0.3)] h-auto md:h-20 items-center">
         <div className="max-w-[1600px] w-full flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6 px-4 md:px-12 h-full py-3 md:py-0">
            <div className="flex items-center gap-4 md:gap-6 shrink-0">
               <div className="flex flex-col">
                  <span className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-widest">Active Workbench</span>
                  <div className="flex items-center gap-3">
                     <div className="bg-indigo-700 text-white px-3 md:px-4 py-1 md:py-1.5 rounded-xl font-black text-base md:text-lg border-2 border-indigo-400 shrink-0 shadow-lg">
                       {selectedIds.length} / {questions.length}
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[10px] md:text-xs font-black text-slate-900 tracking-tight">Selected Items</span>
                        <span className="text-[7px] md:text-[8px] font-bold text-slate-600 uppercase tracking-widest">Total Inventory</span>
                     </div>
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 shrink-0 w-full md:w-auto">
              {selectedIds.length > 0 && (
                <div className="relative flex-1 md:flex-initial" ref={exportMenuRef}>
                  <button 
                    onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                    className="w-full flex items-center justify-center gap-2.5 bg-white text-slate-900 px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-50 transition-all border-2 md:border-4 border-slate-400 active:scale-95 whitespace-nowrap"
                  >
                    <FileDown size={14} className="text-indigo-700" strokeWidth={3} /> 
                    Export Center
                    <ChevronDown size={12} className={`transition-transform duration-300 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isExportMenuOpen && (
                    <div className="absolute bottom-full right-0 mb-3 w-56 md:w-64 bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] border-4 border-slate-500 p-2 animate-in fade-in slide-in-from-bottom-4 duration-300 z-[110]">
                      <div className="px-4 py-2 border-b-2 border-slate-100 mb-2">
                        <span className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-widest">Download Options</span>
                      </div>
                      <button onClick={handleExportWord} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-900 transition-all group text-left">
                        <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform border-2 border-blue-100"><FileText size={16} className="text-blue-600" /></div> Word (.docx)
                      </button>
                      <button onClick={handleExportRtf} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-900 transition-all group text-left">
                        <div className="w-7 h-7 md:w-8 md:h-8 bg-slate-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform border-2 border-slate-300"><FileText size={16} className="text-slate-600" /></div> Rich Text (.rtf)
                      </button>
                      <button onClick={handleExportExcel} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-900 transition-all group text-left">
                        <div className="w-7 h-7 md:w-8 md:h-8 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform border-2 border-emerald-200"><FileSpreadsheet size={16} className="text-emerald-700" /></div> Excel (.csv)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {onDesignPaper && (
                <button 
                  onClick={handleDesignPaperClick}
                  className="flex-1 md:flex-initial bg-slate-900 text-white px-4 md:px-8 py-2.5 md:py-3 rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 border-2 md:border-4 border-slate-700 whitespace-nowrap group"
                >
                  <LayoutDashboard size={16} className="text-indigo-400 group-hover:rotate-6 transition-transform" strokeWidth={3} /> Structure Paper
                </button>
              )}
            </div>
         </div>
      </div>
    </div>
  );
}
