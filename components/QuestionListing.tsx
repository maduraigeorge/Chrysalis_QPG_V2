
import React, { useMemo, useState } from 'react';
import { 
  Image as ImageIcon, 
  CheckCircle, 
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
  Database
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
}

const cleanText = (text: string) => {
  return text.replace(/^\[item[-_ ]?\d+\]\s*/i, '').replace(/ \[Set \d+-\d+\]$/i, '').trim();
};

const QuestionListing: React.FC<Props> = ({ questions, loading, selectedIds, onToggle, onToggleAll, metadata, onDesignPaper }) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const groupedQuestions = useMemo(() => {
    const groups: Record<number, Record<string, Question[]>> = {};
    questions.forEach(q => {
      if (!groups[q.marks]) groups[q.marks] = {};
      if (!groups[q.marks][q.question_type]) groups[q.marks][q.question_type] = [];
      groups[q.marks][q.question_type].push(q);
    });
    return groups;
  }, [questions]);

  const handleExportWord = () => {
    const selected = questions.filter(q => selectedIds.includes(q.id));
    if (selected.length === 0) return alert("Select questions first.");
    exportBankToWord(selected, metadata);
    setIsExportMenuOpen(false);
  };

  const handleExportRtf = () => {
    const selected = questions.filter(q => selectedIds.includes(q.id));
    if (selected.length === 0) return alert("Select questions first.");
    exportBankToRtf(selected, metadata);
    setIsExportMenuOpen(false);
  };

  const handleExportJson = () => {
    const selected = questions.filter(q => selectedIds.includes(q.id));
    if (selected.length === 0) return alert("Select questions first.");
    
    const exportData = {
      subject: metadata.subject,
      grade: metadata.grade,
      exportDate: new Date().toISOString(),
      count: selected.length,
      questions: selected.map(q => ({
        id: q.id,
        text: cleanText(q.question_text),
        answer_key: q.answer_key || "", // Explicit fallback
        marks: q.marks,
        type: q.question_type,
        image: q.image_url,
        lesson: q.lesson_title,
        outcome: q.lo_description
      }))
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    saveAs(blob, `Question_Bank_${metadata.subject}_${metadata.grade}.json`);
    setIsExportMenuOpen(false);
  };

  const handleExportExcel = () => {
    const selected = questions.filter(q => selectedIds.includes(q.id));
    if (selected.length === 0) return alert("Select questions first.");
    
    const headers = ['ID', 'Marks', 'Type', 'Question', 'Answer Key', 'Lesson', 'Learning Outcome', 'Difficulty'];
    const rows = selected.map(q => [
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
    saveAs(blob, `Question_Bank_${metadata.subject}.csv`);
    setIsExportMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 animate-pulse flex gap-4">
            <div className="w-8 h-8 bg-slate-50 rounded-lg shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-2 w-1/4 bg-slate-50 rounded"></div>
              <div className="h-2 w-full bg-slate-50 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-[2rem] border border-dashed border-slate-200 py-24 text-center shadow-inner">
        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
          <HelpCircle className="text-slate-300 w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-slate-900 tracking-tight">Question Bank Empty</h3>
        <p className="text-slate-400 font-bold max-w-sm mx-auto mt-2 uppercase text-[8px] tracking-[0.2em]">
          Refine your Topic Selector parameters to populate this list.
        </p>
      </div>
    );
  }

  const sortedMarks = Object.keys(groupedQuestions).map(Number).sort((a, b) => a - b);

  return (
    <div className="space-y-8 pb-32">
      <div className="flex items-center justify-between bg-white px-6 py-3.5 rounded-2xl border border-slate-100 shadow-sm sticky top-24 z-40 backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-3">
          <ListChecks className="text-indigo-600" size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{questions.length} Items Available</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onToggleAll(questions.map(q => q.id), true)}
            className="text-[9px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 px-3 py-2 rounded-lg transition-all"
          >
            Select All
          </button>
          <button 
            onClick={() => onToggleAll(questions.map(q => q.id), false)}
            className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 px-3 py-2 rounded-lg transition-all"
          >
            Clear
          </button>
        </div>
      </div>

      {sortedMarks.map(marks => (
        <div key={marks} className="space-y-4">
          <div className="flex items-center gap-3 px-1">
             <div className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md">
               {marks} Mark Category
             </div>
             <div className="h-px flex-1 bg-slate-100"></div>
          </div>
          
          <div className="space-y-6">
            {Object.entries(groupedQuestions[marks]).map(([type, items]) => (
              <div key={type} className="space-y-3 ml-2 border-l border-slate-100 pl-6 relative">
                <div className="absolute top-0 -left-[1px] w-0.5 h-1.5 bg-slate-300"></div>
                <div className="flex items-center gap-2 mb-2">
                   <Tag size={10} className="text-slate-400" />
                   <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{type}</h4>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {items.map(q => (
                    <div 
                      key={q.id} 
                      className={`group relative bg-white px-4 py-5 rounded-xl border transition-all cursor-pointer ${selectedIds.includes(q.id) ? 'border-indigo-400 bg-indigo-50/20 shadow-sm ring-1 ring-indigo-100' : 'border-slate-100 hover:border-slate-200'}`}
                      onClick={() => onToggle(q.id)}
                    >
                      <div className="flex gap-4 items-start">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all mt-0.5 ${selectedIds.includes(q.id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200 group-hover:border-indigo-300'}`}>
                          {selectedIds.includes(q.id) && <CheckCircle size={10} className="text-white" />}
                        </div>
                        
                        <div className="flex-1 space-y-4">
                          <div>
                            <p className="text-sm text-slate-800 font-semibold leading-relaxed pr-6">
                              {cleanText(q.question_text)}
                            </p>
                          </div>

                          {q.answer_key && (
                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl px-4 py-3 flex items-start gap-3">
                              <Key size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Answer Key</span>
                                <p className="text-xs font-bold text-emerald-800 leading-normal">{q.answer_key}</p>
                              </div>
                            </div>
                          )}
                          
                          {q.image_url && (
                            <div className="mt-4 w-full max-w-2xl rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-white">
                              <img src={q.image_url} alt="Question Asset" className="w-full h-auto object-contain max-h-[400px]" />
                            </div>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md text-[7px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
                              <Layers size={8} />
                              <span className="max-w-[120px] truncate">{q.lesson_title || 'Uncategorized'}</span>
                            </div>
                            {q.lo_description && (
                              <div className="flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-md text-[7px] font-black text-rose-500 uppercase tracking-widest border border-rose-100">
                                <Target size={8} />
                                <span className="max-w-[150px] truncate">{q.lo_description}</span>
                              </div>
                            )}
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[7px] font-black uppercase tracking-widest border ${q.difficulty === 1 ? 'bg-emerald-50 text-emerald-600 border-emerald-50' : q.difficulty === 2 ? 'bg-amber-50 text-amber-600 border-amber-50' : 'bg-rose-50 text-rose-600 border-rose-50'}`}>
                              <Star size={8} fill="currentColor" />
                              {q.difficulty === 1 ? 'Basic' : q.difficulty === 2 ? 'Medium' : 'Hard'}
                            </div>
                            {q.image_url && (
                              <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-[7px] font-black uppercase tracking-widest border border-blue-100">
                                <ImageIcon size={8} /> Image Included
                              </div>
                            )}
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

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-3xl border-t border-slate-100 p-4 md:p-6 z-[100] flex justify-center no-print shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
         <div className="max-w-[1600px] w-full flex flex-col md:flex-row items-center justify-between gap-6 px-8">
            <div className="flex items-center gap-8">
               <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">Question Bank Core</span>
                  <div className="flex items-center gap-4">
                     <div className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl font-black text-base shadow-xl shadow-indigo-200 ring-4 ring-indigo-50">
                       {selectedIds.length}
                     </div>
                     <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-800 tracking-tight">Active Items Selected</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Ready for curriculum-aligned export</span>
                     </div>
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative">
                <button 
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  className="flex items-center gap-3 bg-white text-slate-700 px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-sm hover:bg-slate-50 transition-all border border-slate-200 active:scale-95"
                >
                  <FileDown size={18} className="text-indigo-500" /> Export Options
                  {isExportMenuOpen ? <ChevronDown size={14} className="rotate-180 transition-transform" /> : <ChevronDown size={14} className="transition-transform" />}
                </button>

                {isExportMenuOpen && (
                  <div className="absolute bottom-full right-0 mb-4 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <button onClick={handleExportWord} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 transition-colors">
                      <FileText size={16} className="text-blue-500" /> Word (.docx)
                    </button>
                    <button onClick={handleExportRtf} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 transition-colors">
                      <FileText size={16} className="text-slate-400" /> RTF (.rtf)
                    </button>
                    <button onClick={handleExportExcel} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 transition-colors">
                      <FileSpreadsheet size={16} className="text-emerald-500" /> Excel (.csv)
                    </button>
                    <button onClick={handleExportJson} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 transition-colors">
                      <Database size={16} className="text-amber-500" /> JSON (.json)
                    </button>
                    <div className="h-px bg-slate-50 my-1 mx-2"></div>
                    <button onClick={() => { window.print(); setIsExportMenuOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 transition-colors">
                      <Printer size={16} className="text-slate-900" /> PDF (Print)
                    </button>
                  </div>
                )}
              </div>

              {onDesignPaper && (
                <button 
                  onClick={onDesignPaper}
                  className="w-full md:w-auto bg-slate-900 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-4 border border-slate-800"
                >
                  <LayoutDashboard size={20} className="text-indigo-400" /> Design Paper
                </button>
              )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default QuestionListing;
