
import React from 'react';
import { AppMode, Question, PaperMetadata, Section } from '../types';

interface Props {
  mode: AppMode;
  metadata: PaperMetadata;
  sections: Section[];
  questions: Question[];
  selectedBankQuestionIds: number[];
}

const cleanText = (text: string) => {
  return text.replace(/^\[item[-_ ]?\d+\]\s*/i, '').replace(/ \[Set \d+-\d+\]$/i, '').trim();
};

const PaperPreview: React.FC<Props> = ({ mode, metadata, sections, questions, selectedBankQuestionIds }) => {
  // Use "Exam" as default title if empty
  const displayTitle = metadata.title.trim() || "Exam";

  if (mode === AppMode.BANK) {
    const selected = questions.filter(q => selectedBankQuestionIds.includes(q.id));
    return (
      <div className="p-4 bg-white max-w-[210mm] mx-auto text-slate-900 relative">
        <div className="text-center mb-4">
          {metadata.schoolLogo && <img src={metadata.schoolLogo} className="h-10 mx-auto mb-2 object-contain" />}
          {metadata.schoolName && <h1 className="text-lg font-black uppercase tracking-tight mb-0.5">{metadata.schoolName}</h1>}
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Question Bank</h2>
        </div>
        <div className="grid grid-cols-2 border-y border-slate-900 py-1.5 mb-4 text-[9px] font-black uppercase tracking-widest">
           <div>Subject: {metadata.subject || 'N/A'}</div>
           <div className="text-right">Grade: {metadata.grade || 'N/A'}</div>
        </div>
        <div className="space-y-3">
          {selected.map((q, i) => (
            <div key={q.id} className="flex flex-col gap-1 border-b border-slate-100 pb-2 last:border-0">
              <div className="flex gap-3">
                <span className="font-black text-slate-900 text-xs w-5 shrink-0">{i + 1}.</span>
                <div className="flex-1">
                  <p className="text-xs text-slate-800 leading-snug font-semibold">{cleanText(q.question_text)}</p>
                  {q.image_url && (
                    <div className="my-1 border border-slate-200 p-0.5 rounded inline-block max-w-full">
                      <img src={q.image_url} className="max-h-40 object-contain" alt="Question illustration" />
                    </div>
                  )}
                  <div className="flex gap-3 text-[8px] font-black uppercase tracking-widest text-slate-400">
                    <span>Type: {q.question_type}</span>
                    <span>Marks: {q.marks}</span>
                  </div>
                </div>
              </div>
              {q.answer_key && (
                <div className="ml-8 mt-0.5 p-1 border border-slate-200">
                  <p className="text-[7px] font-black text-slate-500 uppercase">Key:</p>
                  <p className="text-[10px] font-bold text-slate-900">{q.answer_key}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-white max-w-[210mm] mx-auto min-h-[297mm] text-slate-900 relative">
      {/* Header Section */}
      <div className="text-center mb-3">
        {metadata.schoolLogo && <img src={metadata.schoolLogo} className="h-12 mx-auto mb-2 object-contain" />}
        {metadata.schoolName && <h1 className="text-lg font-black uppercase tracking-tight mb-0.5">{metadata.schoolName}</h1>}
        <h2 className="text-base font-black uppercase mb-2 tracking-widest">{displayTitle}</h2>
        
        {/* Metadata Grid */}
        <div className="grid grid-cols-2 border border-slate-900 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-left">
           <div>
             <p>Subject: <span className="font-bold ml-1">{metadata.subject || 'N/A'}</span></p>
             {metadata.duration && <p>Duration: <span className="font-bold ml-1">{metadata.duration}</span></p>}
           </div>
           <div className="text-right">
             <p>Grade: <span className="font-bold ml-1">{metadata.grade || 'N/A'}</span></p>
             <p>Marks: <span className="font-bold ml-1">{metadata.totalMarks || 'N/A'}</span></p>
           </div>
        </div>
      </div>

      {metadata.instructions && (
        <div className="mb-3 text-[9px] border-b border-slate-200 pb-1 italic">
          <p className="font-black not-italic uppercase tracking-widest text-slate-900">Instructions:</p>
          <div className="whitespace-pre-line text-slate-700 font-medium">{metadata.instructions}</div>
        </div>
      )}

      {/* Main Sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="section-container">
            <div className="flex justify-between items-end border-b border-slate-900 pb-0.5 mb-2 mt-2">
               <h3 className="text-xs font-black uppercase tracking-tight">{section.name}</h3>
               <span className="text-[9px] font-black uppercase tracking-widest">({section.sectionMarks} Marks)</span>
            </div>
            <div className="space-y-2">
              {section.selectedQuestionIds.map((qid, qIdx) => {
                const q = questions.find(q => q.id === qid);
                if (!q) return null;
                return (
                  <div key={q.id} className="flex gap-3 items-start">
                    <span className="font-black text-xs w-5 shrink-0">{qIdx + 1}.</span>
                    <div className="flex-1">
                      <p className="text-xs text-slate-900 leading-snug font-semibold">{cleanText(q.question_text)}</p>
                      {q.image_url && (
                        <div className="mt-1 mb-1 flex justify-center p-1 border border-slate-200">
                          <img src={q.image_url} className="max-h-[200px] object-contain" alt="Academic illustration" />
                        </div>
                      )}
                    </div>
                    <div className="font-black text-slate-600 text-[10px] shrink-0 pt-0.5">[{q.marks}]</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-2 border-t border-slate-900 text-center font-black uppercase tracking-[0.4em] text-slate-400 text-[8px]">
        --- End of Examination ---
      </div>

      {/* Answer Key Page - Forced Break */}
      <div className="page-break" style={{ pageBreakBefore: 'always' }}>
        <div className="text-center mb-3 mt-4">
           <h2 className="text-base font-black uppercase tracking-tight border-b border-slate-900 pb-0.5 inline-block">Answer Key</h2>
           <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-widest">{displayTitle} &bull; {metadata.subject}</p>
        </div>
        
        <div className="space-y-3">
          {sections.map((section) => (
            <div key={section.id + '_ans'}>
              <h3 className="text-[9px] font-black uppercase tracking-widest bg-slate-50 px-2 py-1 mb-2 rounded text-slate-800 border border-slate-200">{section.name}</h3>
              <div className="grid grid-cols-1 gap-1.5 ml-3">
                {section.selectedQuestionIds.map((qid, qIdx) => {
                  const q = questions.find(item => item.id === qid);
                  if (!q) return null;
                  return (
                    <div key={q.id + '_key'} className="flex gap-2 items-start border-l border-slate-200 pl-3 pb-0.5">
                       <span className="font-black text-[9px] text-slate-400 min-w-[14px]">{qIdx + 1}.</span>
                       <div className="flex-1">
                          <p className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter mb-0.5 line-clamp-1 italic">Ref: {cleanText(q.question_text).substring(0, 40)}...</p>
                          <div className="p-1 border border-slate-100">
                            <p className="text-xs font-bold text-slate-900 leading-snug">{q.answer_key || 'No key.'}</p>
                          </div>
                       </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaperPreview;
