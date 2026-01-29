
import saveAs from 'file-saver';
import { Question, PaperMetadata, Section } from '../types';

const cleanText = (text: string) => {
  return text.replace(/^\[item[-_ ]?\d+\]\s*/i, '').replace(/ \[Set \d+-\d+\]$/i, '').trim();
};

const rtfHeader = '{\\rtf1\\ansi\\deff0 {\\fonttbl{\\f0 Times New Roman;}}{\\colortbl;\\red0\\green0\\blue0;\\red128\\green128\\blue128;\\red64\\green64\\blue64;\\red0\\green0\\blue255;\\red0\\green128\\blue0;}';

export const exportBankToRtf = (questions: Question[], metadata: PaperMetadata) => {
  let content = rtfHeader;

  content += '{\\footer\\qc\\fs12 Page {\\field{\\*\\fldinst PAGE}} of {\\field{\\*\\fldinst NUMPAGES}}\\par}';

  if (metadata.schoolName) {
    content += `\\qc\\fs26\\b ${metadata.schoolName}\\b0\\par`;
  }
  content += `\\qc\\fs22\\b Question Bank\\b0\\par`;
  content += `\\qc\\fs16 Subject: ${metadata.subject}    |    Grade: ${metadata.grade}\\par\\par`;

  const groupedByLesson: Record<string, Record<string, Question[]>> = {};
  questions.forEach(q => {
    const lesson = q.lesson_title || 'Uncategorized Lessons';
    const lo = q.lo_description || 'General Learning Outcomes';
    if (!groupedByLesson[lesson]) groupedByLesson[lesson] = {};
    if (!groupedByLesson[lesson][lo]) groupedByLesson[lesson][lo] = [];
    groupedByLesson[lesson][lo].push(q);
  });

  Object.entries(groupedByLesson).forEach(([lessonTitle, loGroups]) => {
    content += `\\ql\\fs18\\b\\ul ${lessonTitle.toUpperCase()}\\ulnone\\b0\\par`;
    
    Object.entries(loGroups).forEach(([loDescription, qs]) => {
      content += `\\fs16\\i Outcome: ${loDescription}\\i0\\par`;
      
      qs.forEach((q, i) => {
        content += `\\fs16\\b ${i + 1}. \\b0 ${cleanText(q.question_text)} \\b [${q.marks}M]\\b0\\par`;
        if (q.answer_key) {
          content += `\\fs14\\cf5\\b [Key]: \\b0 ${q.answer_key}\\cf0\\par`;
        }
      });
      content += `\\par`;
    });
  });

  content += '}';
  const blob = new Blob([content], { type: 'application/rtf' });
  saveAs(blob, `Question_Bank_${metadata.subject}_${metadata.grade}.rtf`);
};

export const exportPaperToRtf = (metadata: PaperMetadata, sections: Section[], questions: Question[]) => {
  let content = rtfHeader;
  const displayTitle = metadata.title.trim() || "Exam";

  content += '{\\footer\\qc\\fs12 Page {\\field{\\*\\fldinst PAGE}} of {\\field{\\*\\fldinst NUMPAGES}}\\par}';

  if (metadata.schoolName) {
    content += `\\qc\\fs30\\b ${metadata.schoolName}\\b0\\par`;
  }
  content += `\\qc\\fs22\\b ${displayTitle}\\b0\\par\\par`;
  
  content += `\\ql\\fs16 Subject: ${metadata.subject} \\tab Grade: ${metadata.grade}\\par`;
  const durationStr = metadata.duration ? `Duration: ${metadata.duration} \\tab ` : "";
  content += `${durationStr}Marks: ${metadata.totalMarks}\\par\\par`;

  if (metadata.instructions) {
    content += `\\b Instructions:\\b0\\par`;
    content += `\\fs14\\i ${metadata.instructions.replace(/\n/g, '\\par ')}\\i0\\par\\par`;
  }

  sections.forEach((section) => {
    content += `\\ql\\fs18\\b ${section.name.toUpperCase()} (${section.sectionMarks} Marks)\\b0\\par`;
    content += `\\line\\par`; 

    section.selectedQuestionIds.forEach((qid, qIdx) => {
      const q = questions.find(item => item.id === qid);
      if (!q) return;
      content += `\\fs16\\b ${qIdx + 1}. \\b0 ${cleanText(q.question_text)} \\tab [${q.marks}]\\par`;
    });
    content += `\\par`;
  });

  // Forced Page Break for Answer Key
  content += `\\page\\qc\\fs22\\b ANSWER KEY\\b0\\par\\par`;
  sections.forEach((section) => {
    content += `\\ql\\fs16\\b ${section.name.toUpperCase()}\\b0\\par`;
    section.selectedQuestionIds.forEach((qid, qIdx) => {
      const q = questions.find(item => item.id === qid);
      if (!q) return;
      content += `${qIdx + 1}. ${q.answer_key || 'No key.'}\\par`;
    });
    content += `\\par`;
  });

  content += '\\qc\\fs12 --- End --- \\par';
  content += '}';
  const blob = new Blob([content], { type: 'application/rtf' });
  saveAs(blob, `Question_Paper_${metadata.subject}_${metadata.grade}.rtf`);
};
