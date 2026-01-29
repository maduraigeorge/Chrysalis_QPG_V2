
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
  if (mode === AppMode.BANK) {
    const selected = questions.filter(q => selectedBankQuestionIds.includes(q.id));
    return (
      <div className="p-10 bg-white max-w-[210mm] mx-auto text-slate-900 relative print:p-0">
        <div className="text-center mb-10">
          {metadata.schoolLogo && <img src={metadata.schoolLogo} className="h-16 mx-auto mb-4 object-contain" />}
          <h1 className="text-2xl font-black uppercase tracking-widest mb-1">{metadata.schoolName || 'Institution Repository'}</h1>
          <h2 className="text-lg font-bold text-slate-500 uppercase tracking-widest">Question Repository Export</h2>
        </div>
        <div className="grid grid-cols-2 border-y-2 border-slate-900 py-4 mb-10 text-[11px] font-black uppercase tracking-widest">
           <div>Subject: {metadata.subject || 'N/A'}</div>
           <div className="text-right">Grade: {metadata.grade || 'N/A'}</div>
        </div>
        <div className="space-y-10">
          {selected.map((q, i) => (
            <div key={q.id} className="flex flex-col gap-3 border-b border-slate-100 pb-8 last:border-0">
              <div className="flex gap-5">
                <span className="font-black text-slate-900 text-lg w-8 shrink-0">{i + 1}.</span>
                <div className="flex-1">
                  <p className="text-base text-slate-800 leading-relaxed font-semibold mb-3">{cleanText(q.question_text)}</p>
                  {q.image_url && (
                    <div className="my-6 border-2 border-slate-100 p-2 rounded-xl inline-block max-w-full">
                      <img src={q.image_url} className="max-h-72 object-contain" alt="Question illustration" />
                    </div>
                  )}
                  <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-t border-slate-50 pt-3">
                    <span>Type: {q.question_type}</span>
                    <span>Weightage: {q.marks} Marks</span>
                  </div>
                </div>
              </div>
              {q.answer_key && (
                <div className="ml-13 mt-2 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">Official Key:</p>
                  <p className="text-sm font-bold text-emerald-900 leading-normal">{q.answer_key}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-16 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] pb-10">
          --- End of Export ---
        </div>
      </div>
    );
  }

  return (
    <div className="p-12 bg-white max-w-[210mm] mx-auto min-h-[297mm] text-slate-900 relative print:p-0">
      <div className="text-center mb-10">
        {metadata.schoolLogo && <img src={metadata.schoolLogo} className="h-20 mx-auto mb-5 object-contain" />}
        <h1 className="text-2xl font-black uppercase tracking-[0.2em] mb-1.5">{metadata.schoolName || 'Institution Name'}</h1>
        <h2 className="text-xl font-black uppercase mb-6 tracking-widest">{metadata.title || 'Examination Paper'}</h2>
        <div className="grid grid-cols-2 border-2 border-slate-900 px-8 py-5 text-xs font-black uppercase tracking-widest text-left gap-y-2">
           <div className="space-y-1.5">
             <p>Subject: <span className="font-bold opacity-80 ml-1">{metadata.subject || 'N/A'}</span></p>
             <p>Duration: <span className="font-bold opacity-80 ml-1">{metadata.duration || 'N/A'}</span></p>
           </div>
           <div className="space-y-1.5 text-right">
             <p>Grade: <span className="font-bold opacity-80 ml-1">{metadata.grade || 'N/A'}</span></p>
             <p>Maximum Marks: <span className="font-bold opacity-80 ml-1">{metadata.totalMarks || 'N/A'}</span></p>
           </div>
        </div>
      </div>

      {metadata.instructions && (
        <div className="mb-10 text-xs leading-relaxed border-b-2 border-slate-100 pb-8 italic">
          <p className="font-black not-italic uppercase mb-2 tracking-widest text-slate-900">General Instructions:</p>
          <div className="whitespace-pre-line text-slate-700 font-medium">{metadata.instructions}</div>
        </div>
      )}

      <div className="space-y-12">
        {sections.map((section, idx) => (
          <div key={section.id} className="section-container">
            <div className="flex justify-between items-end border-b-2 border-slate-900 pb-2 mb-8 mt-10">
               <h3 className="text-lg font-black uppercase tracking-[0.15em]">{section.name}</h3>
               <span className="text-xs font-black uppercase tracking-widest opacity-70">({section.sectionMarks} Marks)</span>
            </div>
            <div className="space-y-10">
              {section.selectedQuestionIds.map((qid, qIdx) => {
                const q = questions.find(q => q.id === qid);
                if (!q) return null;
                return (
                  <div key={q.id} className="flex gap-6">
                    <span className="font-black text-lg w-8 shrink-0">{qIdx + 1}.</span>
                    <div className="flex-1">
                      <p className="text-base text-slate-900 leading-relaxed font-semibold">{cleanText(q.question_text)}</p>
                      {q.image_url && (
                        <div className="mt-8 mb-6 flex justify-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                          <img src={q.image_url} className="max-h-[350px] object-contain shadow-sm" alt="Academic illustration" />
                        </div>
                      )}
                    </div>
                    <div className="font-black text-slate-400 text-base shrink-0 pt-0.5">[{q.marks}]</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-20 pt-10 border-t-2 border-slate-900 text-center font-black uppercase tracking-[0.5em] text-slate-300 text-[10px] page-break">
        --- End of Examination Paper ---
      </div>

      <div className="mt-24 print-only">
        <div className="text-center mb-12">
           <h2 className="text-2xl font-black uppercase tracking-[0.1em] border-b-4 border-slate-900 pb-3 inline-block">Official Answer Key</h2>
           <p className="text-xs font-bold text-slate-500 mt-3 uppercase tracking-widest">{metadata.title} &bull; {metadata.subject}</p>
        </div>
        
        <div className="space-y-12">
          {sections.map((section) => (
            <div key={section.id + '_ans'}>
              <h3 className="text-sm font-black uppercase tracking-widest bg-slate-100 px-6 py-3 mb-6 rounded-lg text-slate-800">{section.name}</h3>
              <div className="grid grid-cols-1 gap-6 ml-6">
                {section.selectedQuestionIds.map((qid, qIdx) => {
                  const q = questions.find(q => q.id === qid);
                  if (!q) return null;
                  return (
                    <div key={q.id + '_key'} className="flex gap-5 items-start border-l-4 border-emerald-100 pl-6 pb-2">
                       <span className="font-black text-sm text-slate-400 min-w-[24px]">{qIdx + 1}.</span>
                       <div className="flex-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1.5 line-clamp-1 italic">Reference: {cleanText(q.question_text).substring(0, 80)}...</p>
                          <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-50">
                            <p className="text-base font-bold text-emerald-900 leading-relaxed">{q.answer_key || 'No solution key provided.'}</p>
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
