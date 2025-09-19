import { create } from 'zustand';
import type { ShiftSubmission, AvailableSlot } from '../types';

interface SubmissionStore {
  submissions: ShiftSubmission[];

  // API operations
  fetchSubmissions: () => Promise<void>;
  fetchSubmissionsByForm: (formId: string) => Promise<void>;
  submitShift: (submission: Omit<ShiftSubmission, 'id' | 'submittedAt' | 'updatedAt'>) => Promise<ShiftSubmission>;
  updateSubmission: (id: string, updates: Partial<ShiftSubmission>) => void;
  deleteSubmission: (id: string) => Promise<void>;

  // Get operations (local)
  getSubmissionsByForm: (formId: string) => ShiftSubmission[];
  getSubmissionByStaff: (formId: string, staffName: string) => ShiftSubmission | undefined;

  updateAvailability: (submissionId: string, slotId: string, availability: Partial<AvailableSlot>) => void;
  bulkUpdateAvailability: (submissionId: string, slots: AvailableSlot[]) => void;

  getStaffAvailabilityMatrix: (formId: string) => Map<string, Map<string, boolean>>;
  getSlotAvailability: (formId: string, slotId: string) => ShiftSubmission[];
}

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

export const useSubmissionStore = create<SubmissionStore>((set, get) => ({
  submissions: [],

  fetchSubmissions: async () => {
    try {
      const response = await fetch(`${API_URL}/api/submissions`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch submissions');
      const submissions = await response.json() as ShiftSubmission[];
      set({ submissions });
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  },

  fetchSubmissionsByForm: async (formId) => {
    try {
      const response = await fetch(`${API_URL}/api/forms/${formId}/submissions`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch submissions');
      const submissions = await response.json() as ShiftSubmission[];

      set((state) => {
        // Remove old submissions for this form and add new ones
        const otherSubmissions = state.submissions.filter(s => s.formId !== formId);
        return { submissions: [...otherSubmissions, ...submissions] };
      });
    } catch (error) {
      console.error('Error fetching submissions by form:', error);
    }
  },

  submitShift: async (submissionData) => {
    try {
      const response = await fetch(`${API_URL}/api/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to submit shift');
      const createdSubmission = await response.json() as ShiftSubmission;

      set((state) => ({
        submissions: [...state.submissions, createdSubmission],
      }));

      return createdSubmission;
    } catch (error) {
      console.error('Error submitting shift:', error);
      throw error;
    }
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

  deleteSubmission: async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/submissions/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to delete submission');

      set((state) => ({
        submissions: state.submissions.filter((sub) => sub.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting submission:', error);
      throw error;
    }
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