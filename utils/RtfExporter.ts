
import saveAs from 'file-saver';
import { Question, PaperMetadata, Section } from '../types';

const cleanText = (text: string) => {
  return text.replace(/^\[item[-_ ]?\d+\]\s*/i, '').replace(/ \[Set \d+-\d+\]$/i, '').trim();
};

const rtfHeader = '{\\rtf1\\ansi\\deff0 {\\fonttbl{\\f0 Times New Roman;}}{\\colortbl;\\red0\\green0\\blue0;\\red128\\green128\\blue128;\\red64\\green64\\blue64;\\red0\\green0\\blue255;\\red0\\green128\\blue0;}';

export const exportBankToRtf = (questions: Question[], metadata: PaperMetadata) => {
  let content = rtfHeader;

  // Page numbering in RTF footer
  content += '{\\footer\\qc\\fs16 Page {\\field{\\*\\fldinst PAGE}} of {\\field{\\*\\fldinst NUMPAGES}}\\par}';

  // Header Section
  content += `\\qc\\fs32\\b ${metadata.schoolName || 'Institution Name'}\\b0\\par`;
  content += `\\qc\\fs28\\b Question Bank Repository\\b0\\par`;
  content += `\\qc\\fs20 Subject: ${metadata.subject}    |    Grade: ${metadata.grade}\\par\\par`;

  const groupedByLesson: Record<string, Record<string, Question[]>> = {};
  questions.forEach(q => {
    const lesson = q.lesson_title || 'Uncategorized Lessons';
    const lo = q.lo_description || 'General Learning Outcomes';
    if (!groupedByLesson[lesson]) groupedByLesson[lesson] = {};
    if (!groupedByLesson[lesson][lo]) groupedByLesson[lesson][lo] = [];
    groupedByLesson[lesson][lo].push(q);
  });

  Object.entries(groupedByLesson).forEach(([lessonTitle, loGroups]) => {
    content += `\\ql\\fs24\\b\\ul ${lessonTitle.toUpperCase()}\\ulnone\\b0\\par`;
    
    Object.entries(loGroups).forEach(([loDescription, qs]) => {
      content += `\\fs20\\i\\cf2 Outcome: ${loDescription}\\cf0\\i0\\par\\par`;
      
      qs.forEach((q, i) => {
        content += `\\fs20\\b ${i + 1}. \\b0 ${cleanText(q.question_text)} \\b [${q.marks} Marks]\\b0\\par`;
        if (q.answer_key) {
          content += `\\fs18\\cf5\\b [ANSWER KEY]: \\b0 ${q.answer_key}\\cf0\\par`;
        }
        if (q.image_url) {
          content += `\\fs18\\cf4\\b [IMAGE ATTACHED]: \\b0 ${q.image_url}\\cf0\\par`;
        }
        content += `\\fs16\\i\\cf1 Type: ${q.question_type}\\cf0\\i0\\par\\par`;
      });
    });
  });

  content += '}';
  const blob = new Blob([content], { type: 'application/rtf' });
  saveAs(blob, `Question_Bank_${metadata.subject}_${metadata.grade}.rtf`);
};

export const exportPaperToRtf = (metadata: PaperMetadata, sections: Section[], questions: Question[]) => {
  let content = rtfHeader;

  // Page numbering in RTF footer
  content += '{\\footer\\qc\\fs16 Page {\\field{\\*\\fldinst PAGE}} of {\\field{\\*\\fldinst NUMPAGES}}\\par}';

  // Header Section
  content += `\\qc\\fs36\\b ${metadata.schoolName || 'Institution Name'}\\b0\\par`;
  content += `\\qc\\fs28\\b ${metadata.title}\\b0\\par\\par`;
  
  content += `\\ql\\fs20 Subject: ${metadata.subject} \\tab\\tab Grade: ${metadata.grade}\\par`;
  content += `Duration: ${metadata.duration} \\tab\\tab Max Marks: ${metadata.totalMarks}\\par\\par`;

  if (metadata.instructions) {
    content += `\\b General Instructions:\\b0\\par`;
    content += `\\i ${metadata.instructions.replace(/\n/g, '\\par ')}\\i0\\par\\par`;
  }

  sections.forEach((section) => {
    content += `\\ql\\fs24\\b ${section.name.toUpperCase()} (${section.sectionMarks} Marks)\\b0\\par`;
    content += `\\hr\\par`; 

    section.selectedQuestionIds.forEach((qid, qIdx) => {
      const q = questions.find(item => item.id === qid);
      if (!q) return;
      content += `\\fs20\\b ${qIdx + 1}. \\b0 ${cleanText(q.question_text)} \\tab [${q.marks}]\\par`;
      if (q.image_url) {
        content += `\\fs18\\cf4\\b [SEE ILLUSTRATION]: \\b0 ${q.image_url}\\cf0\\par`;
      }
      content += `\\par`;
    });
  });

  content += `\\page\\qc\\fs32\\b OFFICIAL ANSWER KEY\\b0\\par\\par`;
  sections.forEach((section) => {
    content += `\\ql\\fs20\\b ${section.name.toUpperCase()}\\b0\\par`;
    section.selectedQuestionIds.forEach((qid, qIdx) => {
      const q = questions.find(item => item.id === qid);
      if (!q) return;
      content += `${qIdx + 1}. ${q.answer_key || 'No key.'}\\par`;
    });
    content += `\\par`;
  });

  content += '\\qc\\fs18\\cf1 --- End of Paper ---\\cf0\\par';
  content += '}';
  const blob = new Blob([content], { type: 'application/rtf' });
  saveAs(blob, `Question_Paper_${metadata.subject}_${metadata.grade}.rtf`);
};
