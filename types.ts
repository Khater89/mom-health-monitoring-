
export interface VitalSigns {
  date: string;
  bloodPressure: string;
  sugarLevel: number;
  heartRate: number;
  hba1c?: number;
  creatinine?: number;
  hemoglobin?: number;
}

export interface Payment {
  id: string;
  payer: string;
  kind: string;
  amount: number;
  currency: string;
  date: string;
}

export interface Attachment {
  id: string;
  name: string;
  mime: string;
  addedAt: number;
  base64?: string;
  kind?: string;
  driveFileId?: string; // معرف الملف في جوجل درايف
}

export interface Medication {
  id: string;
  nameAr: string;
  nameEn: string;
  scientificName?: string;
  dosage: string;
  time: string;
  dosageSchedule?: string;
  purpose: string;
  categoryAr?: string;
  status: 'active' | 'stopped';
  stopReason?: string;
  price?: number;
  paidBy?: string;
  attachments: Attachment[];
  payments: Payment[];
  source: 'drive' | 'manual';
}

export type MedicalRecordKind = 'visits' | 'labs' | 'meds' | 'er' | 'hospital' | 'costs' | 'plan';

export enum AppRoute {
  DASHBOARD = 'DASHBOARD',
  JOURNEY = 'JOURNEY',
  ANALYSIS = 'ANALYSIS',
  VOICE = 'VOICE',
  MEDS = 'MEDS',
  SETTINGS = 'SETTINGS',
}

export interface MedicalRecord {
  id: string;
  kind: MedicalRecordKind;
  title: string;
  date: string; 
  time?: string;
  place: string;
  doctorSpecialty?: string; // تخصص الطبيب
  doctorPhone?: string;     // رقم الطبيب
  expectedCost: number;
  actualCost?: number; 
  currency: string;
  afterReviewNotes?: string;
  recommendations?: string;
  attachments: Attachment[];
  completed: boolean; 
  isAiAnalyzed?: boolean;
  payments: Payment[];
  source: 'drive' | 'manual';
}

export interface UserProfile {
  name: string;
  age?: number;
  conditions?: string[];
  dietaryRestrictions: string[];
  stage?: string;
  goals?: string[];
  driveFolderId?: string;
}

export interface MealPlan {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
}

export interface AnalysisResult {
  summary: string;
  medications: Partial<Medication>[];
  advice: string;
  category: MedicalRecordKind; // التصنيف التلقائي للملف
}
