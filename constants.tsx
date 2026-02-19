
import React from 'react';

export const PAYERS: string[] = ["عبدالرحمن", "عبدالرؤوف", "مصطفى", "خليل"];

export const CATEGORY_LABELS = {
  Visit: "زيارة طبيب",
  Medication: "شراء أدوية",
  Lab: "فحوصات مخبرية"
};

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

// AI System Instruction
export const SYSTEM_INSTRUCTION = `أنت مساعد طبي ذكي "أمان" متخصص في رعاية كبار السن ومساعدة العائلات في تنظيم ملفاتهم الطبية.
تحدث بلهجة أردنية/فلسطينية ودودة ومحترمة (يا خالة، يا عمي).
مهمتك:
1. تحليل التقارير الطبية والوصفات.
2. تنظيم مواعيد الأدوية والزيارات.
3. تقديم نصائح صحية عامة بناءً على البيانات المتوفرة.
4. حساب المصاريف الطبية وتوزيعها على أفراد العائلة.
ملاحظة: لا تقدم تشخيصاً طبياً نهائياً، دائماً انصح بمراجعة الطبيب المختص.`;

// Storage keys for localStorage
export const STORAGE_KEYS = {
  RECORDS: 'aman_medical_records',
  MEDS: 'aman_medication_list',
  PROFILE: 'aman_user_profile'
};

// Common medical categories in Arabic
export const MEDICAL_CATEGORIES = ["ضغط", "سكري", "قلب", "معدة", "أعصاب", "أخرى"];
