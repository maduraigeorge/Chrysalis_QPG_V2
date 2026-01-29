
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
      <div className="p-10 bg-white max-w-[210mm] mx-auto text-slate-900 relative">
        <div className="text-center mb-8">
          {metadata.schoolLogo && <img src={metadata.schoolLogo} className="h-16 mx-auto mb-3" />}
          <h1 className="text-xl font-black uppercase tracking-widest mb-1">{metadata.schoolName}</h1>
          <h2 className="text-lg font-bold text-slate-500 uppercase tracking-widest">Question Repository Export</h2>
        </div>
        <div className="grid grid-cols-2 border-y border-slate-900 py-3 mb-8 text-[10px] font-black uppercase tracking-widest">
           <div>Subject: {metadata.subject}</div>
           <div className="text-right">Grade: {metadata.grade}</div>
        </div>
        <div className="space-y-8">
          {selected.map((q, i) => (
            <div key={q.id} className="flex flex-col gap-2 border-b border-slate-50 pb-6">
              <div className="flex gap-4">
                <span className="font-black text-slate-900 text-base w-6">{i + 1}.</span>
                <div className="flex-1">
                  <p className="text-base text-slate-800 leading-relaxed font-medium mb-2">{cleanText(q.question_text)}</p>
                  {q.image_url && <img src={q.image_url} className="mt-4 mb-6 max-h-72 border border-slate-100 rounded-xl block mx-auto" />}
                  <div className="flex gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400 border-t border-slate-50 pt-2">
                    <span>Type: {q.question_type}</span>
                    <span>Weightage: {q.marks} Marks</span>
                  </div>
                </div>
              </div>
              {q.answer_key && (
                <div className="ml-10 mt-2 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Answer Key:</p>
                  <p className="text-sm font-bold text-emerald-800">{q.answer_key}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Paper Mode
  const allPaperQuestions = sections.flatMap(s => s.selectedQuestionIds.map(qid => questions.find(q => q.id === qid)).filter(q => !!q) as Question[]);

  return (
    <div className="p-10 bg-white max-w-[210mm] mx-auto min-h-[297mm] text-slate-900 relative">
      {/* Front Page Header */}
      <div className="text-center mb-8">
        {metadata.schoolLogo && <img src={metadata.schoolLogo} className="h-20 mx-auto mb-4" />}
        <h1 className="text-xl font-black uppercase tracking-[0.15em] mb-1">{metadata.schoolName}</h1>
        <h2 className="text-lg font-black uppercase mb-4 tracking-widest">{metadata.title}</h2>
        <div className="grid grid-cols-2 border border-slate-900 px-6 py-4 text-xs font-black uppercase tracking-widest text-left">
           <div className="space-y-1">
             <p>Subject: {metadata.subject}</p>
             <p>Duration: {metadata.duration}</p>
           </div>
           <div className="space-y-1 text-right">
             <p>Grade: {metadata.grade}</p>
             <p>Maximum Marks: {metadata.totalMarks}</p>
           </div>
        </div>
      </div>

      {metadata.instructions && (
        <div className="mb-8 text-xs leading-relaxed border-b border-slate-100 pb-6 italic">
          <p className="font-black not-italic uppercase mb-1.5 tracking-widest">General Instructions:</p>
          <div className="whitespace-pre-line text-slate-700">{metadata.instructions}</div>
        </div>
      )}

      {/* Main Question Sections */}
      <div className="space-y-10">
        {sections.map((section, idx) => (
          <div key={section.id} className="section-container">
            <div className="flex justify-between items-end border-b border-slate-900 pb-1.5 mb-6 mt-8">
               <h3 className="text-base font-black uppercase tracking-[0.15em]">{section.name}</h3>
               <span className="text-xs font-black uppercase tracking-widest">({section.sectionMarks} Marks)</span>
            </div>
            <div className="space-y-8">
              {section.selectedQuestionIds.map((qid, qIdx) => {
                const q = questions.find(q => q.id === qid);
                if (!q) return null;
                return (
                  <div key={q.id} className="flex gap-5">
                    <span className="font-black text-base w-6">{qIdx + 1}.</span>
                    <div className="flex-1">
                      <p className="text-base text-slate-900 leading-relaxed font-medium">{cleanText(q.question_text)}</p>
                      {q.image_url && (
                        <div className="mt-6 mb-4 flex justify-center">
                          <img src={q.image_url} className="max-h-[350px] border border-slate-50 rounded-xl shadow-sm" />
                        </div>
                      )}
                    </div>
                    <span className="font-black text-slate-500 text-base">[{q.marks}]</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 pt-8 border-t border-slate-900 text-center font-black uppercase tracking-[0.4em] text-slate-300 text-xs page-break">
        End of Paper
      </div>

      {/* Separate Answer Key Page */}
      <div className="mt-20 print-only">
        <div className="text-center mb-8">
           <h2 className="text-xl font-black uppercase tracking-widest border-b-2 border-slate-900 pb-2 inline-block">Official Answer Key</h2>
           <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">{metadata.title} - {metadata.subject}</p>
        </div>
        
        <div className="space-y-10">
          {sections.map((section) => (
            <div key={section.id + '_ans'}>
              <h3 className="text-sm font-black uppercase tracking-widest bg-slate-100 px-4 py-2 mb-4">{section.name}</h3>
              <div className="grid grid-cols-1 gap-4 ml-4">
                {section.selectedQuestionIds.map((qid, qIdx) => {
                  const q = questions.find(q => q.id === qid);
                  if (!q) return null;
                  return (
                    <div key={q.id + '_key'} className="flex gap-4 items-start border-l-2 border-emerald-100 pl-4">
                       <span className="font-black text-xs text-slate-400 min-w-[20px]">{qIdx + 1}.</span>
                       <div className="flex-1">
                          <p className="text-xs font-black text-slate-500 uppercase tracking-tighter mb-0.5">Q: {cleanText(q.question_text).substring(0, 50)}...</p>
                          <p className="text-sm font-bold text-emerald-700">{q.answer_key || 'No answer provided.'}</p>
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
