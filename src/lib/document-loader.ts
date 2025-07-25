import { Document, DocumentCategory } from '../types/documents';

// This would normally be a server-side function, but for demo purposes
// we'll use a static list that matches the actual PDF files
const PDF_FILES = [
  // Abstract files (2)
  'Abstract - Expanded Indication for Elevidys.pdf',
  'Abstract - How Safe is Gene Therapy?.pdf',
  
  // FDA files (19)
  'FDA - Analytical Method Review Memo - ELEVIDYS.pdf',
  'FDA - Bioresearch Monitoring Final Review Memo - ELEVIDYS.pdf',
  'FDA - CBER CMC BLA Review Memo - ELEVIDYS.pdf',
  'FDA - CBER-DMPQ CMC-Facility BLA Review Memo - ELEVIDYS.pdf',
  'FDA - Clinical Pharmacology BLA Review - ELEVIDYS.pdf',
  'FDA - Clinical Review Memo - ELEVIDYS.pdf',
  'FDA - Drug Label - ELEVIDYS.pdf',
  'FDA - Informal Teleconference Summary, May 22, 2023 - ELEVIDYS.pdf',
  'FDA - Internal Meeting Summary, May 15, 2023 - ELEVIDYS.pdf',
  'FDA - Internal Meeting Summary, May 16, 2023 - ELEVIDYS.pdf',
  'FDA - Internal Meeting Summary, May 18, 2023 - ELEVIDYS.pdf',
  'FDA - Internal Meeting Summary, May 19, 2023 - ELEVIDYS.pdf',
  'FDA - IVD Companion Diagnostic Device Memo - ELEVIDYS.pdf',
  'FDA - June-22-2023-Approval-Letter-ELEVIDYS.pdf',
  'FDA - Labeling Review - ELEVIDYS.pdf',
  'FDA - Late-Cycle Meeting Summary - ELEVIDYS.pdf',
  'FDA - Memorandum - ELEVIDYS.pdf',
  'FDA - Mid-Cycle Communication Summary - ELEVIDYS.pdf',
  'FDA - Officer and Employee List - ELEVIDYS.pdf',
  'FDA - Package-Insert-ZOLGENSMA_1.pdf',
  'FDA - Pharmacology-Toxicology Review - ELEVIDYS.pdf',
  'FDA - Pharmacovigilance Plan Review Memo - ELEVIDYS.pdf',
  'FDA - Review of Lot Release Protocol Template - ELEVIDYS.pdf',
  'FDA - Statistical Review - ELEVIDYS.pdf',
  
  // Press Report files (4)
  'Press Report - Sarepta faces new scrutiny after 3rd patient death.pdf',
  'Press Report - Sarepta Refused FDA Request to Halt Elevidys Shipments.pdf',
  'Press Report - Sarepta stands behind Elevidys after FDA requests gene therapy be pulled from market _ Fierce Pharma.pdf',
  'Press Report - Sarepta, bowing to FDA pressure, pauses shipments of Duchenne gene therapy Elevidys _ Fierce Pharma.pdf',
  
  // Publication files (18)
  'Publication - AAV gene therapy for Duchenne muscular dystrophy.pdf',
  'Publication - Caregiver Global Impression Observations from EMBARK.pdf',
  'Publication - Delandistrogene Moxeparvovec Gene Therapy in Ambulatory Patients aged 4 to 8.pdf',
  'Publication - delandistrogene-moxeparvovec-gene-therapy-in-individuals-with-duchenne-muscular-dystrophy-evidence-in.pdf',
  'Publication - Development of capsid- and genome-modified optimized AAVrh74 vectors for muscle gene therapy.pdf',
  'Publication - Expression of SRP-9001 dystrophin and stabilization of motor function up to 2 years post-treatment.pdf',
  'Publication - Gene therapy approval for Duchenne muscular dystrophy.pdf',
  'Publication - Immunologic investigations into transgene directed immune-mediated myositis.pdf',
  'Publication - long-term-survival-and-myocardial-function-following-systemic-delivery-of-delandistrogene-moxeparvovec.pdf',
  'Publication - Long‐term safety and functional outcomes of delandistrogene moxeparvovec gene therapy.pdf',
  'Publication - Management of Select Adverse Events Following Delandistrogene Moxeparvovec Gene Therapy for Patients with Duchenne Muscular Dystrophy.pdf',
  'Publication - Neuromuscular diseases.pdf',
  'Publication - Paving the way for future gene therapies.pdf',
  'Publication - Practical Considerations for Delandistrogene Moxeparvovec Gene Therapy in Patients with Duchenne Muscular Dystrophy.pdf',
  'Publication - Quantitative Muscle Magnetic Resonance Outcomes in Patients with Duchenne Muscular Dystrophy.pdf',
  'Publication - some-functional-improvements-in-placebo-and-delandistrogene-moxeparvovec-treated-trial-participants.pdf',
  'Publication - The FDA approval of delandistrogene moxeparvovec-rokl for Duchenne muscular dystrophy  a critical examination of the evidence and regulatory process.pdf',
  'Publication - Use of plasmapheresis to lower anti-AAV antibodies in nonhuman primates with pre-existing immunity to AAVrh74.pdf',
  'Publication - Validity of remote live stream video evaluation of the North Star Ambulatory Assessment in patients with Duchenne muscular dystrophy.pdf',
  
  // SEC files (2)
  'SEC - 8K Filing - 07.21.25 - Sarepta.pdf',
  'SEC - Sarepta 10K Annual Report - 04.25.pdf'
];

function getCategoryFromFilename(filename: string): DocumentCategory {
  if (filename.startsWith('Abstract')) return DocumentCategory.ABSTRACT;
  if (filename.startsWith('FDA')) return DocumentCategory.FDA;
  if (filename.startsWith('Publication')) return DocumentCategory.PUBLICATION;
  if (filename.startsWith('Press Report')) return DocumentCategory.PRESS_REPORT;
  if (filename.startsWith('SEC')) return DocumentCategory.SEC;
  
  // Fallback
  return DocumentCategory.PUBLICATION;
}

function generateDocumentId(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/\.pdf$/, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function generateTitle(filename: string): string {
  // Remove the category prefix and file extension
  let title = filename.replace(/^(Abstract|FDA|Publication|Press Report|SEC) - /, '');
  title = title.replace(/\.pdf$/, '');
  
  // Clean up some common patterns
  title = title.replace(/ _ /g, ' - ');
  title = title.replace(/ELEVIDYS/g, 'Elevidys');
  
  return title;
}

function getEstimatedFileSize(filename: string): number {
  // Estimate file sizes based on document type and length
  const baseSize = 500000; // 500KB base
  const lengthMultiplier = filename.length * 1000;
  
  if (filename.includes('Clinical Review')) return 2700000;
  if (filename.includes('10K Annual Report')) return 2200000;
  if (filename.includes('AAV gene therapy')) return 5500000;
  if (filename.includes('Immunologic investigations')) return 4400000;
  
  return Math.min(baseSize + lengthMultiplier, 3000000);
}

export function loadAllDocuments(): Document[] {
  return PDF_FILES.map(filename => ({
    id: generateDocumentId(filename),
    title: generateTitle(filename),
    filename,
    category: getCategoryFromFilename(filename),
          path: `${process.env.NODE_ENV === 'production' ? '/sarepta-fda-2025' : ''}/pdf/${encodeURIComponent(filename)}`, // Use basePath for GitHub Pages
    size: getEstimatedFileSize(filename),
    processed: false,
    uploadDate: new Date('2024-07-24'), // Use repository date
    lastModified: new Date('2024-07-24')
  }));
}

export function getDocumentsByCategory(category: DocumentCategory): Document[] {
  return loadAllDocuments().filter(doc => doc.category === category);
}

export function getDocumentStats() {
  const documents = loadAllDocuments();
  const stats = {
    total: documents.length,
    byCategory: {} as Record<DocumentCategory, number>
  };
  
  // Initialize all categories
  Object.values(DocumentCategory).forEach(category => {
    stats.byCategory[category] = 0;
  });
  
  // Count documents by category
  documents.forEach(doc => {
    stats.byCategory[doc.category]++;
  });
  
  return stats;
} 