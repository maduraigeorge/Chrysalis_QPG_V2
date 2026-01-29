
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
      <div className="p-8 bg-white max-w-[210mm] mx-auto text-slate-900 relative">
        <div className="text-center mb-6">
          {metadata.schoolLogo && <img src={metadata.schoolLogo} className="h-12 mx-auto mb-3 object-contain" />}
          {metadata.schoolName && <h1 className="text-xl font-black uppercase tracking-widest mb-1">{metadata.schoolName}</h1>}
          <h2 className="text-base font-bold text-slate-500 uppercase tracking-widest">Question Repository</h2>
        </div>
        <div className="grid grid-cols-2 border-y border-slate-900 py-2 mb-6 text-[10px] font-black uppercase tracking-widest">
           <div>Subject: {metadata.subject || 'N/A'}</div>
           <div className="text-right">Grade: {metadata.grade || 'N/A'}</div>
        </div>
        <div className="space-y-6">
          {selected.map((q, i) => (
            <div key={q.id} className="flex flex-col gap-2 border-b border-slate-50 pb-4 last:border-0">
              <div className="flex gap-4">
                <span className="font-black text-slate-900 text-sm w-6 shrink-0">{i + 1}.</span>
                <div className="flex-1">
                  <p className="text-sm text-slate-800 leading-snug font-semibold mb-2">{cleanText(q.question_text)}</p>
                  {q.image_url && (
                    <div className="my-2 border border-slate-100 p-1 rounded-lg inline-block max-w-full">
                      <img src={q.image_url} className="max-h-48 object-contain" alt="Question illustration" />
                    </div>
                  )}
                  <div className="flex gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400 border-t border-slate-50 pt-2">
                    <span>Type: {q.question_type}</span>
                    <span>Weight: {q.marks}M</span>
                  </div>
                </div>
              </div>
              {q.answer_key && (
                <div className="ml-10 mt-1 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                  <p className="text-[8px] font-black text-emerald-600 uppercase mb-0.5">Key:</p>
                  <p className="text-xs font-bold text-emerald-900">{q.answer_key}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-8 text-center text-[9px] font-black text-slate-200 uppercase tracking-[0.5em] pb-6">
          --- End of Export ---
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 bg-white max-w-[210mm] mx-auto min-h-[297mm] text-slate-900 relative">
      <div className="text-center mb-6">
        {metadata.schoolLogo && <img src={metadata.schoolLogo} className="h-16 mx-auto mb-3 object-contain" />}
        {metadata.schoolName && <h1 className="text-xl font-black uppercase tracking-[0.1em] mb-1">{metadata.schoolName}</h1>}
        <h2 className="text-lg font-black uppercase mb-4 tracking-widest">{displayTitle}</h2>
        <div className="grid grid-cols-2 border border-slate-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-left gap-y-1">
           <div className="space-y-0.5">
             <p>Subject: <span className="font-bold opacity-80 ml-1">{metadata.subject || 'N/A'}</span></p>
             {metadata.duration && <p>Duration: <span className="font-bold opacity-80 ml-1">{metadata.duration}</span></p>}
           </div>
           <div className="space-y-0.5 text-right">
             <p>Grade: <span className="font-bold opacity-80 ml-1">{metadata.grade || 'N/A'}</span></p>
             <p>Marks: <span className="font-bold opacity-80 ml-1">{metadata.totalMarks || 'N/A'}</span></p>
           </div>
        </div>
      </div>

      {metadata.instructions && (
        <div className="mb-6 text-[10px] leading-tight border-b border-slate-100 pb-4 italic">
          <p className="font-black not-italic uppercase mb-1 tracking-widest text-slate-900">Instructions:</p>
          <div className="whitespace-pre-line text-slate-700 font-medium">{metadata.instructions}</div>
        </div>
      )}

      <div className="space-y-6">
        {sections.map((section, idx) => (
          <div key={section.id} className="section-container">
            <div className="flex justify-between items-end border-b border-slate-900 pb-1 mb-4 mt-4">
               <h3 className="text-sm font-black uppercase tracking-[0.1em]">{section.name}</h3>
               <span className="text-[10px] font-black uppercase tracking-widest opacity-70">({section.sectionMarks} Marks)</span>
            </div>
            <div className="space-y-4">
              {section.selectedQuestionIds.map((qid, qIdx) => {
                const q = questions.find(q => q.id === qid);
                if (!q) return null;
                return (
                  <div key={q.id} className="flex gap-4">
                    <span className="font-black text-sm w-6 shrink-0">{qIdx + 1}.</span>
                    <div className="flex-1">
                      <p className="text-sm text-slate-900 leading-snug font-semibold">{cleanText(q.question_text)}</p>
                      {q.image_url && (
                        <div className="mt-3 mb-2 flex justify-center bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                          <img src={q.image_url} className="max-h-[250px] object-contain shadow-sm" alt="Academic illustration" />
                        </div>
                      )}
                    </div>
                    <div className="font-black text-slate-400 text-sm shrink-0 pt-0.5">[{q.marks}]</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 pt-6 border-t border-slate-900 text-center font-black uppercase tracking-[0.5em] text-slate-300 text-[9px] page-break">
        --- End of Examination ---
      </div>

      <div className="mt-12">
        <div className="text-center mb-6">
           <h2 className="text-lg font-black uppercase tracking-[0.1em] border-b-2 border-slate-900 pb-1 inline-block">Official Answer Key</h2>
           <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-widest">{displayTitle} &bull; {metadata.subject}</p>
        </div>
        
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.id + '_ans'}>
              <h3 className="text-[10px] font-black uppercase tracking-widest bg-slate-50 px-4 py-2 mb-3 rounded text-slate-800 border border-slate-100">{section.name}</h3>
              <div className="grid grid-cols-1 gap-3 ml-4">
                {section.selectedQuestionIds.map((qid, qIdx) => {
                  const q = questions.find(item => item.id === qid);
                  if (!q) return null;
                  return (
                    <div key={q.id + '_key'} className="flex gap-3 items-start border-l-2 border-emerald-100 pl-4 pb-1">
                       <span className="font-black text-[10px] text-slate-400 min-w-[16px]">{qIdx + 1}.</span>
                       <div className="flex-1">
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-tighter mb-0.5 line-clamp-1 italic">Ref: {cleanText(q.question_text).substring(0, 60)}...</p>
                          <div className="bg-emerald-50/30 p-1.5 rounded border border-emerald-50/50">
                            <p className="text-sm font-bold text-emerald-900 leading-snug">{q.answer_key || 'No key provided.'}</p>
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
