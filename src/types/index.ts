export interface ShiftForm {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  timeSlots: TimeSlot[];
  additionalQuestions: Question[];
  requiredRoles: Role[];
  createdAt: Date;
  updatedAt: Date;
  shareUrl?: string;
  qrCode?: string;
  isActive: boolean;
}

export interface TimeSlot {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  requiredStaff: number;
  minStaff: number;
  maxStaff: number;
}

export interface Question {
  id: string;
  type: 'text' | 'select' | 'multiselect' | 'textarea';
  label: string;
  required: boolean;
  options?: string[];
}

export interface Role {
  id: string;
  name: string;
  color: string;
  minRequired?: number;
  maxAllowed?: number;
}

export interface ShiftSubmission {
  id: string;
  formId: string;
  staffName: string;
  email?: string;
  phoneNumber?: string;
  availableSlots: AvailableSlot[];
  answers: Record<string, any>;
  submittedAt: Date;
  updatedAt: Date;
  priority?: number;
}

export interface AvailableSlot {
  slotId: string;
  isAvailable: boolean;
  preferredRoles?: string[];
  notes?: string;
}

export interface ShiftAssignment {
  id: string;
  formId: string;
  assignments: Assignment[];
  status: 'draft' | 'confirmed' | 'published';
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface Assignment {
  slotId: string;
  staffAssignments: StaffAssignment[];
}

export interface StaffAssignment {
  staffId: string;
  staffName: string;
  role?: string;
  isConfirmed: boolean;
}

export interface ShiftRule {
  id: string;
  type: 'ng_combination' | 'required_role' | 'skill_balance' | 'min_staff' | 'max_consecutive';
  name: string;
  enabled: boolean;
  config: Record<string, any>;
}

export interface NGCombinationRule extends ShiftRule {
  type: 'ng_combination';
  config: {
    staffIds: string[];
  };
}

export interface RequiredRoleRule extends ShiftRule {
  type: 'required_role';
  config: {
    roleId: string;
    minCount: number;
  };
}

export interface SkillBalanceRule extends ShiftRule {
  type: 'skill_balance';
  config: {
    seniorRatio: number;
    juniorRatio: number;
  };
}

export interface Notification {
  id: string;
  type: 'email' | 'line';
  recipients: string[];
  subject: string;
  message: string;
  sentAt?: Date;
  status: 'pending' | 'sent' | 'failed';
}

export interface Staff {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  role?: Role;
  skillLevel: 'junior' | 'intermediate' | 'senior';
  joinedAt: Date;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  timeSlots: Omit<TimeSlot, 'id' | 'date'>[];
  additionalQuestions: Omit<Question, 'id'>[];
  requiredRoles: Role[];
  createdAt: Date;
}

export type ViewMode = 'spreadsheet' | 'calendar' | 'timeline';
export type FormStatus = 'draft' | 'active' | 'closed';
export type ShiftStatus = 'pending' | 'confirmed' | 'published';