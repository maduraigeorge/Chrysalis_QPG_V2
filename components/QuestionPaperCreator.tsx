
import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  ChevronRight, 
  ClipboardList, 
  Settings2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Image as ImageIcon,
  Building2,
  X,
  Edit2,
  Save,
  Clock,
  Type,
  GripVertical,
  Link as LinkIcon,
  Printer,
  Calculator,
  Download,
  Share2,
  FileDown,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  Sparkles,
  Maximize2,
  Minimize2,
  Key
} from 'lucide-react';
import { Question, PaperMetadata, Section } from '../types';
import { apiService } from '../apiService';
import { exportPaperToWord } from '../utils/DocxExporter';
import { exportPaperToRtf } from '../utils/RtfExporter';
import saveAs from 'file-saver';

interface Props {
  questions: Question[];
  metadata: PaperMetadata;
  onMetadataChange: (meta: PaperMetadata) => void;
  sections: Section[];
  onSectionsChange: (sections: Section[]) => void;
  onRefreshQuestions?: () => void;
}

const cleanText = (text: string) => {
  return text.replace(/^\[item[-_ ]?\d+\]\s*/i, '').replace(/ \[Set \d+-\d+\]$/i, '').trim();
};

const QuestionPaperCreator: React.FC<Props> = ({ questions, metadata, onMetadataChange, sections, onSectionsChange, onRefreshQuestions }) => {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addSection = () => {
    const id = Math.random().toString(36).substr(2, 9);
    const newSection: Section = {
      id,
      name: `Section ${String.fromCharCode(65 + sections.length)}`,
      questionType: 'MCQ',
      marksPerQuestion: 1,
      sectionMarks: 10,
      selectedQuestionIds: []
    };
    onSectionsChange([...sections, newSection]);
    setActiveSectionId(id);
  };

  const removeSection = (id: string) => {
    onSectionsChange(sections.filter(s => s.id !== id));
    if (activeSectionId === id) setActiveSectionId(null);
  };

  const updateSection = (id: string, updates: Partial<Section>) => {
    onSectionsChange(sections.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const toggleQuestionInSection = (sectionId: string, questionId: number, maxCount: number) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    const isSelected = section.selectedQuestionIds.includes(questionId);
    if (!isSelected && section.selectedQuestionIds.length >= maxCount) return;
    const newIds = isSelected ? section.selectedQuestionIds.filter(id => id !== questionId) : [...section.selectedQuestionIds, questionId];
    updateSection(sectionId, { selectedQuestionIds: newIds });
  };

  const openQuestionModal = (section: Section, question?: Question) => {
    setEditingQuestion(question || {
      subject: metadata.subject, 
      grade: metadata.grade, 
      question_type: section.questionType,
      marks: section.marksPerQuestion, 
      question_text: '', 
      answer_key: '',
      image_url: null, 
      difficulty: 1,
      lesson_id: questions[0]?.lesson_id || 1,
    });
    setIsModalOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestion?.question_text) return;
    const savedQ = await apiService.createQuestion(editingQuestion);
    if (onRefreshQuestions) await onRefreshQuestions();
    
    if (activeSectionId && !editingQuestion.id) {
        const section = sections.find(s => s.id === activeSectionId);
        if (section) {
          const needed = section.marksPerQuestion > 0 ? Math.floor(section.sectionMarks / section.marksPerQuestion) : 0;
          if (section.selectedQuestionIds.length < needed) {
            updateSection(activeSectionId, { selectedQuestionIds: [...section.selectedQuestionIds, savedQ.id] });
          }
        }
    }
    setIsModalOpen(false);
    setEditingQuestion(null);
  };

  const handleDragStart = (idx: number) => {
    setDraggedIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetIdx: number) => {
    if (draggedIndex === null || draggedIndex === targetIdx) return;
    const newSections = [...sections];
    const [draggedItem] = newSections.splice(draggedIndex, 1);
    newSections.splice(targetIdx, 0, draggedItem);
    onSectionsChange(newSections);
    setDraggedIndex(null);
  };

  const globalSelectedIds = useMemo(() => sections.reduce((acc, s) => [...acc, ...s.selectedQuestionIds], [] as number[]), [sections]);
  const totalAllocatedMarks = useMemo(() => sections.reduce((sum, s) => sum + s.sectionMarks, 0), [sections]);
  const isAligned = totalAllocatedMarks === metadata.totalMarks;

  const handleExportWord = () => {
    exportPaperToWord(metadata, sections, questions);
    setIsExportMenuOpen(false);
  };

  const handleExportRtf = () => {
    exportPaperToRtf(metadata, sections, questions);
    setIsExportMenuOpen(false);
  };

  const handleExportExcel = () => {
    const headers = ['Section', 'ID', 'Marks', 'Type', 'Question', 'Answer Key'];
    const rows = sections.flatMap(s => 
      s.selectedQuestionIds.map(qid => {
        const q = questions.find(item => item.id === qid);
        if (!q) return [];
        return [
          s.name,
          q.id,
          q.marks,
          q.question_type,
          `"${cleanText(q.question_text).replace(/"/g, '""')}"`,
          `"${(q.answer_key || '').replace(/"/g, '""')}"`
        ];
      }).filter(r => r.length > 0)
    );
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `Question_Paper_${metadata.subject}_Structure.csv`);
    setIsExportMenuOpen(false);
  };

  const handleAutogradeSubmit = () => {
    const selectedQuestions = questions.filter(q => globalSelectedIds.includes(q.id));
    const autogradePayload = {
      source: 'Chrysalis QP Generator',
      version: '2.0',
      timestamp: new Date().toISOString(),
      metadata,
      sections: sections.map(s => ({
        id: s.id,
        name: s.name,
        questionType: s.questionType,
        marksPerQuestion: s.marksPerQuestion,
        totalSectionMarks: s.sectionMarks,
        questionIds: s.selectedQuestionIds
      })),
      questionBank: selectedQuestions.map(q => ({
        id: q.id,
        text: cleanText(q.question_text),
        answer_key: q.answer_key || "", // Explicit fallback to ensure key exists in JSON
        marks: q.marks,
        type: q.question_type,
        image: q.image_url,
        subject: q.subject,
        grade: q.grade
      }))
    };
    
    const blob = new Blob([JSON.stringify(autogradePayload, null, 2)], { type: 'application/json' });
    saveAs(blob, `QP_${metadata.subject}_${metadata.grade}_Autograde.json`);
    setIsExportMenuOpen(false);
  };

  return (
    <div className="space-y-12 pb-48 relative">
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8 md:p-12 space-y-10">
        <div className="flex items-center gap-6 border-b border-slate-50 pb-8">
           <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
             <ClipboardList size={28} />
           </div>
           <div>
             <h2 className="text-xl font-black text-slate-900 tracking-tight">Question Paper Setup</h2>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Institutional Identity & Constraints</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-3 space-y-4">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Logo</label>
             <div className="w-full aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center group hover:bg-white hover:border-indigo-400 transition-all cursor-pointer overflow-hidden relative">
               {metadata.schoolLogo ? (
                 <img src={metadata.schoolLogo} className="w-full h-full object-contain p-6" />
               ) : (
                 <>
                   <ImageIcon className="text-slate-200 mb-2 group-hover:text-indigo-400 transition-colors" size={32} />
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center px-4 leading-relaxed">Drop Institutional Branding</span>
                 </>
               )}
               <input type="file" accept="image/*" onChange={e => {
                 const file = e.target.files?.[0];
                 if (file) {
                   const reader = new FileReader();
                   reader.onloadend = () => onMetadataChange({...metadata, schoolLogo: reader.result as string});
                   reader.readAsDataURL(file);
                 }
               }} className="absolute inset-0 opacity-0 cursor-pointer" />
             </div>
          </div>

          <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Examination Title</label>
                <input type="text" value={metadata.title} onChange={e => onMetadataChange({...metadata, title: e.target.value})} className="w-full bg-slate-50 border-transparent rounded-xl px-6 py-4 text-xs font-bold text-slate-700 focus:bg-white border border-slate-100 shadow-inner" placeholder="e.g. Annual Summative Assessment" />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Institution Name</label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input type="text" value={metadata.schoolName} onChange={e => onMetadataChange({...metadata, schoolName: e.target.value})} className="w-full bg-slate-50 border-transparent rounded-xl pl-11 pr-6 py-4 text-xs font-bold text-slate-700 focus:bg-white border border-slate-100 shadow-inner" />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Exam Duration</label>
                <div className="relative group">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input type="text" value={metadata.duration} onChange={e => onMetadataChange({...metadata, duration: e.target.value})} className="w-full bg-slate-50 border-transparent rounded-xl pl-11 pr-6 py-4 text-xs font-bold text-slate-700 focus:bg-white border border-slate-100 shadow-inner" />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Max Marks Target</label>
                <div className="relative group">
                  <Calculator className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input type="number" value={metadata.totalMarks} onChange={e => onMetadataChange({...metadata, totalMarks: Number(e.target.value)})} className="w-full bg-slate-50 border-transparent rounded-xl pl-11 pr-6 py-4 text-xs font-black text-slate-900 focus:bg-white border border-slate-100 shadow-inner" />
                </div>
             </div>
             <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Exam Instructions</label>
                <textarea rows={3} value={metadata.instructions} onChange={e => onMetadataChange({...metadata, instructions: e.target.value})} className="w-full bg-slate-50 border-transparent rounded-2xl px-6 py-4 text-xs font-medium text-slate-600 focus:bg-white border border-slate-100 shadow-inner resize-none"></textarea>
             </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200"><Settings2 size={20} /></div>
             <div>
               <h3 className="text-lg font-black text-slate-900 tracking-tight">Paper Sections</h3>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Shuffle with Drag Handle</p>
             </div>
          </div>
          <button onClick={addSection} className="bg-white border-2 border-indigo-600 text-indigo-600 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-md active:scale-95 flex items-center gap-2">
            <Plus size={14} /> Add Section
          </button>
        </div>

        <div className="space-y-6">
          {sections.map((section, idx) => {
            const isActive = activeSectionId === section.id;
            const needed = section.marksPerQuestion > 0 ? Math.floor(section.sectionMarks / section.marksPerQuestion) : 0;
            const allocated = section.selectedQuestionIds.length * section.marksPerQuestion;
            const isFull = section.sectionMarks > 0 && allocated === section.sectionMarks;
            const eligible = questions.filter(q => q.question_type === section.questionType && q.marks === section.marksPerQuestion);

            return (
              <div 
                key={section.id} 
                draggable={!isActive}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(idx)}
                className={`bg-white rounded-[2rem] border transition-all overflow-hidden ${isActive ? 'ring-8 ring-indigo-500/5 border-indigo-200 shadow-2xl scale-[1.01]' : 'border-slate-100 shadow-xl shadow-slate-200/50'} ${draggedIndex === idx ? 'opacity-40 grayscale border-dashed border-indigo-300' : ''}`}
              >
                <div onClick={() => setActiveSectionId(isActive ? null : section.id)} className="px-8 py-6 flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-6">
                    <div 
                      className={`p-2 rounded-lg cursor-grab active:cursor-grabbing transition-colors ${draggedIndex === idx ? 'bg-indigo-100 text-indigo-600' : 'text-slate-200 hover:text-slate-400 hover:bg-slate-50'}`}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <GripVertical size={20} />
                    </div>

                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black transition-all ${isFull ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900 tracking-tight">{section.name}</h4>
                      <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">
                         <span className="text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">{section.questionType}</span>
                         <span className={isFull ? 'text-emerald-500 font-black' : 'text-slate-400'}>{allocated} / {section.sectionMarks} Marks</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                     {!isFull && <div className="hidden md:flex items-center gap-2 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest"><AlertCircle size={12} /> {needed - section.selectedQuestionIds.length} Missing</div>}
                     <button onClick={e => { e.stopPropagation(); removeSection(section.id); }} className="text-slate-200 hover:text-rose-500 transition-colors p-2 hover:bg-rose-50 rounded-xl"><Trash2 size={20} /></button>
                     <div className="p-2 hover:bg-indigo-50 rounded-xl text-slate-300 hover:text-indigo-600 transition-all flex items-center gap-2">
                        {isActive ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                        <ChevronRight className={`transition-transform w-5 h-5 ${isActive ? 'rotate-90' : ''}`} />
                     </div>
                  </div>
                </div>

                {isActive && (
                  <div className="px-8 pb-8 border-t border-slate-50 pt-8 animate-in slide-in-from-top-4 duration-300">
                    <div className="bg-slate-50/50 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 border border-slate-100 shadow-inner">
                      <div className="space-y-1.5 md:col-span-1">
                         <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Section Title</label>
                         <div className="relative">
                            <Type className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                            <input 
                              type="text" 
                              value={section.name} 
                              onChange={e => updateSection(section.id, { name: e.target.value })} 
                              className="w-full bg-white border-transparent border rounded-xl pl-10 pr-4 py-3 text-xs font-black text-slate-700 shadow-sm focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100/50 transition-all" 
                              placeholder="e.g. Section A"
                            />
                         </div>
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Question Type</label>
                         <select value={section.questionType} onChange={e => updateSection(section.id, { questionType: e.target.value, selectedQuestionIds: [] })} className="w-full bg-white border-transparent border rounded-xl px-4 py-3 text-xs font-black text-slate-700 shadow-sm">
                           {Array.from(new Set(questions.map(q => q.question_type))).map(t => <option key={t} value={t}>{t}</option>)}
                         </select>
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Mark Per Item</label>
                         <input type="number" min="0" value={section.marksPerQuestion} onChange={e => updateSection(section.id, { marksPerQuestion: Number(e.target.value), selectedQuestionIds: [] })} className="w-full bg-white border-transparent border rounded-xl px-4 py-3 text-xs font-black text-slate-700 shadow-sm" />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Marks</label>
                         <input type="number" min="0" value={section.sectionMarks} onChange={e => updateSection(section.id, { sectionMarks: Number(e.target.value), selectedQuestionIds: [] })} className="w-full bg-white border-transparent border rounded-xl px-4 py-3 text-xs font-black text-slate-700 shadow-sm" />
                      </div>
                      <div className="md:col-span-4 flex justify-end pt-2">
                         <button onClick={() => openQuestionModal(section)} className="bg-white border border-indigo-200 text-indigo-600 px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center gap-2">
                           <Plus size={14} /> Add Custom Question
                         </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                         <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Available Question Bank</h5>
                         <div className="flex items-center gap-3">
                           <button 
                             onClick={() => {
                               const eligibleIds = eligible.map(q => q.id);
                               const alreadySelectedInOther = globalSelectedIds.filter(id => !section.selectedQuestionIds.includes(id));
                               const trulyEligible = eligibleIds.filter(id => !alreadySelectedInOther.includes(id));
                               const countToTake = Math.min(trulyEligible.length, needed);
                               updateSection(section.id, { selectedQuestionIds: trulyEligible.slice(0, countToTake) });
                             }}
                             className="text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:underline bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
                           >
                             Add All
                           </button>
                         </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                        {eligible.map(q => {
                          const sel = section.selectedQuestionIds.includes(q.id);
                          const other = globalSelectedIds.includes(q.id) && !sel;
                          const capacity = !sel && section.selectedQuestionIds.length >= needed;
                          
                          return (
                            <div key={q.id} className="relative group">
                              <div 
                                onClick={() => { if (!other && (!capacity || sel)) toggleQuestionInSection(section.id, q.id, needed); }} 
                                className={`px-5 py-4 rounded-2xl border flex items-center gap-4 transition-all ${sel ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-slate-100 hover:border-slate-200'} ${other || (capacity && !sel) ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                <div className={`w-5 h-5 rounded-lg border-2 shrink-0 flex items-center justify-center transition-all ${sel ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200 group-hover:border-indigo-300'}`}>{sel && <CheckCircle2 size={10} className="text-white" />}</div>
                                <div className="flex-1 flex flex-col gap-3">
                                   <div className="flex-1">
                                      <p className="text-xs font-semibold text-slate-800 leading-normal pr-12">{cleanText(q.question_text)}</p>
                                   </div>
                                   {q.answer_key && (
                                     <div className="bg-emerald-50 px-3 py-1.5 rounded-lg text-[8px] font-bold text-emerald-700 flex items-center gap-2 w-fit">
                                       <Key size={10} /> Key: {q.answer_key}
                                     </div>
                                   )}
                                   {q.image_url && (
                                     <div className="w-full max-w-sm h-32 rounded-xl overflow-hidden border border-slate-100 shrink-0 bg-slate-50">
                                       <img src={q.image_url} className="w-full h-full object-contain" alt="Preview" />
                                     </div>
                                   )}
                                </div>
                              </div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); openQuestionModal(section, q); }} 
                                className="absolute right-4 top-4 p-2 bg-white rounded-lg shadow-md border border-slate-50 text-slate-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Edit2 size={14} />
                              </button>
                            </div>
                          );
                        })}
                        {eligible.length === 0 && (
                          <div className="py-12 text-center text-slate-300 bg-slate-50/30 rounded-3xl border border-dashed border-slate-100 flex flex-col items-center gap-3">
                            <AlertTriangle size={24} />
                            <p className="text-[9px] font-black uppercase tracking-widest">No pool matches for these criteria</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-center pt-8">
          <button 
            onClick={addSection} 
            className="group relative flex items-center gap-3 bg-white border-2 border-dashed border-slate-200 text-slate-400 px-12 py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all active:scale-95 shadow-sm"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" /> Add Another Section
          </button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-3xl border-t border-slate-100 p-4 md:p-6 z-[100] flex justify-center no-print shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
         <div className="max-w-[1600px] w-full flex flex-wrap items-center justify-between gap-6 px-8">
            <div className="flex items-center gap-10">
               <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">Validation Audit</span>
                  <div className="flex items-center gap-8">
                     <div className="flex items-center gap-5 bg-slate-50 border border-slate-100 rounded-[1.25rem] px-6 py-4 shadow-inner min-w-[320px]">
                        <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                           <div className={`h-full transition-all duration-1000 ease-out ${isAligned ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]'}`} style={{ width: `${Math.min(100, (totalAllocatedMarks/metadata.totalMarks)*100)}%` }}></div>
                        </div>
                        <span className={`text-base font-black tabular-nums tracking-tighter ${isAligned ? 'text-emerald-600' : 'text-slate-800'}`}>
                           {totalAllocatedMarks} <span className="text-slate-300 font-bold mx-0.5">/</span> {metadata.totalMarks}
                        </span>
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
                    <div className="h-px bg-slate-50 my-1 mx-2"></div>
                    <button onClick={() => { window.print(); setIsExportMenuOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 transition-colors">
                      <Printer size={16} className="text-slate-900" /> Print / PDF
                    </button>
                  </div>
                )}
              </div>

              <button 
                onClick={handleAutogradeSubmit}
                className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:brightness-110 transition-all active:scale-95 border-none"
              >
                <Sparkles size={18} className="text-white fill-white/20 animate-pulse" /> Submit to Autograde
              </button>
            </div>
         </div>
      </div>

      {isModalOpen && editingQuestion && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
             <div className="bg-slate-900 p-8 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black tracking-tight">{editingQuestion.id ? 'Refine Item' : 'New Academic Item'}</h3>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Direct bank modification</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-2.5 rounded-full transition-colors"><X size={20} /></button>
             </div>
             <div className="p-10 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                      <div className="bg-slate-50 px-5 py-3 rounded-xl text-xs font-bold text-slate-600 border border-slate-100">{editingQuestion.question_type}</div>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Marks</label>
                      <div className="bg-slate-50 px-5 py-3 rounded-xl text-xs font-bold text-slate-600 border border-slate-100">{editingQuestion.marks} Marks</div>
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic Prompt</label>
                   <textarea autoFocus rows={4} value={editingQuestion.question_text} onChange={e => setEditingQuestion({...editingQuestion, question_text: e.target.value})} className="w-full bg-slate-50 border-transparent rounded-2xl px-6 py-4 text-xs font-bold text-slate-700 focus:bg-white border border-slate-100 shadow-inner resize-none"></textarea>
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Solution Key</label>
                   <div className="relative group">
                     <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                     <input type="text" value={editingQuestion.answer_key || ''} onChange={e => setEditingQuestion({...editingQuestion, answer_key: e.target.value})} placeholder="Correct answer..." className="w-full bg-slate-50 border-transparent rounded-xl pl-12 pr-5 py-4 text-xs font-bold text-slate-700 focus:bg-white border border-slate-100 shadow-inner" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset URL</label>
                   <div className="relative group">
                     <ImageIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                     <input type="text" value={editingQuestion.image_url || ''} onChange={e => setEditingQuestion({...editingQuestion, image_url: e.target.value})} placeholder="https://..." className="w-full bg-slate-50 border-transparent rounded-xl pl-12 pr-5 py-4 text-xs font-bold text-slate-700 focus:bg-white border border-slate-100 shadow-inner" />
                   </div>
                </div>
                <div className="flex gap-4 pt-4">
                   <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Discard</button>
                   <button onClick={handleSaveQuestion} className="flex-2 bg-indigo-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 px-10">
                     <Save size={18} /> Commit Changes
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionPaperCreator;
