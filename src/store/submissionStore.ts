import { create } from 'zustand';
import type { ShiftSubmission, AvailableSlot } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface SubmissionStore {
  submissions: ShiftSubmission[];
  
  submitShift: (submission: Omit<ShiftSubmission, 'id' | 'submittedAt' | 'updatedAt'>) => ShiftSubmission;
  updateSubmission: (id: string, updates: Partial<ShiftSubmission>) => void;
  deleteSubmission: (id: string) => void;
  getSubmissionsByForm: (formId: string) => ShiftSubmission[];
  getSubmissionByStaff: (formId: string, staffName: string) => ShiftSubmission | undefined;
  
  updateAvailability: (submissionId: string, slotId: string, availability: Partial<AvailableSlot>) => void;
  bulkUpdateAvailability: (submissionId: string, slots: AvailableSlot[]) => void;
  
  getStaffAvailabilityMatrix: (formId: string) => Map<string, Map<string, boolean>>;
  getSlotAvailability: (formId: string, slotId: string) => ShiftSubmission[];
}

export const useSubmissionStore = create<SubmissionStore>((set, get) => ({
  submissions: [],
  
  submitShift: (submissionData) => {
    const existingSubmission = get().getSubmissionByStaff(
      submissionData.formId,
      submissionData.staffName
    );
    
    if (existingSubmission) {
      const updated: ShiftSubmission = {
        ...existingSubmission,
        ...submissionData,
        updatedAt: new Date(),
      };
      
      set((state) => ({
        submissions: state.submissions.map((sub) =>
          sub.id === existingSubmission.id ? updated : sub
        ),
      }));
      
      return updated;
    }
    
    const newSubmission: ShiftSubmission = {
      ...submissionData,
      id: uuidv4(),
      submittedAt: new Date(),
      updatedAt: new Date(),
    };
    
    set((state) => ({
      submissions: [...state.submissions, newSubmission],
    }));
    
    return newSubmission;
  },
  
  updateSubmission: (id, updates) => {
    set((state) => ({
      submissions: state.submissions.map((sub) =>
        sub.id === id
          ? { ...sub, ...updates, updatedAt: new Date() }
          : sub
      ),
    }));
  },
  
  deleteSubmission: (id) => {
    set((state) => ({
      submissions: state.submissions.filter((sub) => sub.id !== id),
    }));
  },
  
  getSubmissionsByForm: (formId) => {
    return get().submissions.filter((sub) => sub.formId === formId);
  },
  
  getSubmissionByStaff: (formId, staffName) => {
    return get().submissions.find(
      (sub) => sub.formId === formId && sub.staffName === staffName
    );
  },
  
  updateAvailability: (submissionId, slotId, availability) => {
    set((state) => ({
      submissions: state.submissions.map((sub) =>
        sub.id === submissionId
          ? {
              ...sub,
              availableSlots: sub.availableSlots.map((slot) =>
                slot.slotId === slotId
                  ? { ...slot, ...availability }
                  : slot
              ),
              updatedAt: new Date(),
            }
          : sub
      ),
    }));
  },
  
  bulkUpdateAvailability: (submissionId, slots) => {
    set((state) => ({
      submissions: state.submissions.map((sub) =>
        sub.id === submissionId
          ? {
              ...sub,
              availableSlots: slots,
              updatedAt: new Date(),
            }
          : sub
      ),
    }));
  },
  
  getStaffAvailabilityMatrix: (formId) => {
    const submissions = get().getSubmissionsByForm(formId);
    const matrix = new Map<string, Map<string, boolean>>();
    
    submissions.forEach((submission) => {
      const staffAvailability = new Map<string, boolean>();
      submission.availableSlots.forEach((slot) => {
        staffAvailability.set(slot.slotId, slot.isAvailable);
      });
      matrix.set(submission.staffName, staffAvailability);
    });
    
    return matrix;
  },
  
  getSlotAvailability: (formId, slotId) => {
    const submissions = get().getSubmissionsByForm(formId);
    return submissions.filter((submission) =>
      submission.availableSlots.some(
        (slot) => slot.slotId === slotId && slot.isAvailable
      )
    );
  },
}));