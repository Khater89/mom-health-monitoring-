
export type PayerName = "عبدالرحمن" | "عبدالرؤوف" | "مصطفى" | "خليل" | "الوالدة" | "آخر";
export type MedicalRecordKind = 'visits' | 'labs' | 'er' | 'hospital' | 'costs' | 'meds';

export interface Attachment {
  id: string;
  name: string;
  mime: string;
  addedAt: number;
  base64: string;
}

export interface Medication {
  id: string;
  nameAr: string;
  dosage?: string;
  purpose?: string;
  categoryAr?: string;
  time?: string;
  status: 'active' | 'inactive';
  paidBy: string;
  price: number;
  isRepeatable: boolean; 
  analysisResult?: string;
}

export interface MedicalRecord {
  id: string;
  kind: MedicalRecordKind;
  title: string;
  date: string;
  place?: string;
  specialty?: string;
  doctorName?: string;
  visitType?: 'كشفية' | 'مراجعة';
  expectedCost: number;
  actualCost: number;
  preVisitNote?: string; // للحجز المسبق
  postVisitNote?: string; // عند الإغلاق
  recommendedBy?: string; // دكتور التوصية للمختبر
  doctorRecommendations?: string; // ملاحظات الدكتور للمقارنة
  afterReviewNotes?: string; // تحليل AI
  paidBy: string;
  attachments: Attachment[];
  completed: boolean; // تحديد حالة الاكتمال
}

export enum AppRoute {
  DASHBOARD = 'dashboard',
  JOURNEY = 'journey',
  ANALYSIS = 'analysis',
  MEDS = 'meds',
  SETTINGS = 'settings',
  VOICE = 'voice',
  AI_CHAT = 'ai_chat'
}

/**
 * Added missing types for MealPlanner and other components
 */
export interface MealPlan {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
}

export interface UserProfile {
  name: string;
  stage: string;
  goals: string[];
  dietaryRestrictions: string[];
}

export interface Payment {
  id: string;
  amount: number;
  payer: string;
  date: string;
}

export interface Visit {
  id: string;
  specialty: string;
  doctor_name: string;
  visit_date: string;
  visit_type: string;
  status: 'Scheduled' | 'Completed';
  cost: number;
  payer: PayerName;
  pre_visit_note?: string;
}
