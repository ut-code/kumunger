import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { 
  ShiftForm, 
  TimeSlot, 
  Question, 
  Role, 
  Template 
} from '../types';

interface FormStore {
  forms: ShiftForm[];
  templates: Template[];
  currentForm: ShiftForm | null;
  
  // API base URL
  apiUrl: string;
  
  // Form CRUD operations
  fetchForms: () => Promise<void>;
  createForm: (title: string, description?: string) => Promise<ShiftForm>;
  updateForm: (id: string, updates: Partial<ShiftForm>) => Promise<void>;
  deleteForm: (id: string) => Promise<void>;
  getForm: (id: string) => Promise<ShiftForm | undefined>;
  duplicateForm: (id: string) => Promise<void>;
  
  // Form components management
  addTimeSlot: (formId: string, slot: Omit<TimeSlot, 'id'>) => Promise<void>;
  updateTimeSlot: (formId: string, slotId: string, updates: Partial<TimeSlot>) => Promise<void>;
  deleteTimeSlot: (formId: string, slotId: string) => Promise<void>;
  
  addQuestion: (formId: string, question: Omit<Question, 'id'>) => Promise<void>;
  updateQuestion: (formId: string, questionId: string, updates: Partial<Question>) => Promise<void>;
  deleteQuestion: (formId: string, questionId: string) => Promise<void>;
  
  addRole: (formId: string, role: Omit<Role, 'id'>) => Promise<void>;
  updateRole: (formId: string, roleId: string, updates: Partial<Role>) => Promise<void>;
  deleteRole: (formId: string, roleId: string) => Promise<void>;
  
  // Templates
  createTemplate: (formId: string, name: string, description?: string) => void;
  applyTemplate: (formId: string, templateId: string) => void;
  deleteTemplate: (templateId: string) => void;
  
  // Share & QR Code
  generateShareUrl: (formId: string) => Promise<string>;
  generateQRCode: (formId: string) => Promise<string>;
  
  // Utility
  setCurrentForm: (form: ShiftForm | null) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useFormStore = create<FormStore>((set, get) => ({
  forms: [],
  templates: [],
  currentForm: null,
  apiUrl: API_URL,

  fetchForms: async () => {
    try {
      const response = await fetch(`${API_URL}/api/forms`);
      if (!response.ok) throw new Error('Failed to fetch forms');
      const forms = await response.json();
      set({ forms });
    } catch (error) {
      console.error('Error fetching forms:', error);
    }
  },

  createForm: async (title, description) => {
    try {
      const newForm = {
        title,
        description: description || '',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        timeSlots: [],
        additionalQuestions: [],
        requiredRoles: [],
        isActive: true,
      };

      const response = await fetch(`${API_URL}/api/forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newForm),
      });

      if (!response.ok) throw new Error('Failed to create form');
      const createdForm = await response.json();
      
      set((state) => ({
        forms: [createdForm, ...state.forms],
        currentForm: createdForm,
      }));

      return createdForm;
    } catch (error) {
      console.error('Error creating form:', error);
      throw error;
    }
  },

  updateForm: async (id, updates) => {
    try {
      const response = await fetch(`${API_URL}/api/forms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update form');
      const updatedForm = await response.json();

      set((state) => ({
        forms: state.forms.map((form) =>
          form.id === id ? updatedForm : form
        ),
        currentForm: state.currentForm?.id === id ? updatedForm : state.currentForm,
      }));
    } catch (error) {
      console.error('Error updating form:', error);
      throw error;
    }
  },

  deleteForm: async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/forms/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete form');

      set((state) => ({
        forms: state.forms.filter((form) => form.id !== id),
        currentForm: state.currentForm?.id === id ? null : state.currentForm,
      }));
    } catch (error) {
      console.error('Error deleting form:', error);
      throw error;
    }
  },

  getForm: async (id) => {
    try {
      // First check local state
      const localForm = get().forms.find((form) => form.id === id);
      if (localForm) return localForm;

      // If not found locally, fetch from API
      const response = await fetch(`${API_URL}/api/forms/${id}`);
      if (!response.ok) {
        if (response.status === 404) return undefined;
        throw new Error('Failed to fetch form');
      }
      
      const form = await response.json();
      
      // Update local state with fetched form
      set((state) => {
        const exists = state.forms.some(f => f.id === id);
        if (!exists) {
          return { forms: [...state.forms, form] };
        }
        return state;
      });
      
      return form;
    } catch (error) {
      console.error('Error getting form:', error);
      return undefined;
    }
  },

  duplicateForm: async (id) => {
    try {
      const originalForm = await get().getForm(id);
      if (!originalForm) return;

      const duplicatedForm = {
        ...originalForm,
        title: `${originalForm.title} (コピー)`,
        timeSlots: originalForm.timeSlots || [],
        additionalQuestions: originalForm.additionalQuestions || [],
        requiredRoles: originalForm.requiredRoles || [],
      };

      // Remove id fields for creation
      delete (duplicatedForm as any).id;
      delete (duplicatedForm as any).createdAt;
      delete (duplicatedForm as any).updatedAt;
      delete (duplicatedForm as any).shareUrl;
      delete (duplicatedForm as any).qrCode;

      const response = await fetch(`${API_URL}/api/forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicatedForm),
      });

      if (!response.ok) throw new Error('Failed to duplicate form');
      const createdForm = await response.json();

      set((state) => ({
        forms: [createdForm, ...state.forms],
      }));
    } catch (error) {
      console.error('Error duplicating form:', error);
    }
  },

  addTimeSlot: async (formId, slot) => {
    try {
      const form = await get().getForm(formId);
      if (!form) return;

      const newSlot = { ...slot, id: uuidv4() };
      const updatedTimeSlots = [...(form.timeSlots || []), newSlot];

      await get().updateForm(formId, { timeSlots: updatedTimeSlots });
    } catch (error) {
      console.error('Error adding time slot:', error);
    }
  },

  updateTimeSlot: async (formId, slotId, updates) => {
    try {
      const form = await get().getForm(formId);
      if (!form) return;

      const updatedTimeSlots = form.timeSlots.map((slot) =>
        slot.id === slotId ? { ...slot, ...updates } : slot
      );

      await get().updateForm(formId, { timeSlots: updatedTimeSlots });
    } catch (error) {
      console.error('Error updating time slot:', error);
    }
  },

  deleteTimeSlot: async (formId, slotId) => {
    try {
      const form = await get().getForm(formId);
      if (!form) return;

      const updatedTimeSlots = form.timeSlots.filter((slot) => slot.id !== slotId);
      await get().updateForm(formId, { timeSlots: updatedTimeSlots });
    } catch (error) {
      console.error('Error deleting time slot:', error);
    }
  },

  addQuestion: async (formId, question) => {
    try {
      const form = await get().getForm(formId);
      if (!form) return;

      const newQuestion = { ...question, id: uuidv4() };
      const updatedQuestions = [...(form.additionalQuestions || []), newQuestion];

      await get().updateForm(formId, { additionalQuestions: updatedQuestions });
    } catch (error) {
      console.error('Error adding question:', error);
    }
  },

  updateQuestion: async (formId, questionId, updates) => {
    try {
      const form = await get().getForm(formId);
      if (!form) return;

      const updatedQuestions = form.additionalQuestions.map((q) =>
        q.id === questionId ? { ...q, ...updates } : q
      );

      await get().updateForm(formId, { additionalQuestions: updatedQuestions });
    } catch (error) {
      console.error('Error updating question:', error);
    }
  },

  deleteQuestion: async (formId, questionId) => {
    try {
      const form = await get().getForm(formId);
      if (!form) return;

      const updatedQuestions = form.additionalQuestions.filter((q) => q.id !== questionId);
      await get().updateForm(formId, { additionalQuestions: updatedQuestions });
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  },

  addRole: async (formId, role) => {
    try {
      const form = await get().getForm(formId);
      if (!form) return;

      const newRole = { ...role, id: uuidv4() };
      const updatedRoles = [...(form.requiredRoles || []), newRole];

      await get().updateForm(formId, { requiredRoles: updatedRoles });
    } catch (error) {
      console.error('Error adding role:', error);
    }
  },

  updateRole: async (formId, roleId, updates) => {
    try {
      const form = await get().getForm(formId);
      if (!form) return;

      const updatedRoles = form.requiredRoles.map((role) =>
        role.id === roleId ? { ...role, ...updates } : role
      );

      await get().updateForm(formId, { requiredRoles: updatedRoles });
    } catch (error) {
      console.error('Error updating role:', error);
    }
  },

  deleteRole: async (formId, roleId) => {
    try {
      const form = await get().getForm(formId);
      if (!form) return;

      const updatedRoles = form.requiredRoles.filter((role) => role.id !== roleId);
      await get().updateForm(formId, { requiredRoles: updatedRoles });
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  },

  createTemplate: (formId, name, description) => {
    const form = get().forms.find((f) => f.id === formId);
    if (!form) return;

    const template: Template = {
      id: uuidv4(),
      name,
      description,
      timeSlots: form.timeSlots.map(({ id, date, ...rest }) => rest),
      additionalQuestions: form.additionalQuestions.map(({ id, ...rest }) => rest),
      requiredRoles: form.requiredRoles,
      createdAt: new Date(),
    };

    set((state) => ({
      templates: [...state.templates, template],
    }));
  },

  applyTemplate: (formId, templateId) => {
    const template = get().templates.find((t) => t.id === templateId);
    if (!template) return;

    const form = get().forms.find((f) => f.id === formId);
    if (!form) return;

    const timeSlots = template.timeSlots.map((slot) => ({
      ...slot,
      id: uuidv4(),
      date: form.startDate,
    }));

    const additionalQuestions = template.additionalQuestions.map((q) => ({
      ...q,
      id: uuidv4(),
    }));

    get().updateForm(formId, {
      timeSlots,
      additionalQuestions,
      requiredRoles: template.requiredRoles,
    });
  },

  deleteTemplate: (templateId) => {
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== templateId),
    }));
  },

  generateShareUrl: async (formId) => {
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${API_URL}/api/forms/${formId}/share-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl }),
      });

      if (!response.ok) throw new Error('Failed to generate share URL');
      const updatedForm = await response.json();

      set((state) => ({
        forms: state.forms.map((form) =>
          form.id === formId ? updatedForm : form
        ),
      }));

      return updatedForm.shareUrl;
    } catch (error) {
      console.error('Error generating share URL:', error);
      return '';
    }
  },

  generateQRCode: async (formId) => {
    try {
      const shareUrl = await get().generateShareUrl(formId);
      if (!shareUrl) throw new Error('Failed to generate share URL');

      const QRCode = (await import('qrcode')).default;
      const qrCode = await QRCode.toDataURL(shareUrl);

      const response = await fetch(`${API_URL}/api/forms/${formId}/qr-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode }),
      });

      if (!response.ok) throw new Error('Failed to save QR code');
      const updatedForm = await response.json();

      set((state) => ({
        forms: state.forms.map((form) =>
          form.id === formId ? updatedForm : form
        ),
      }));

      return qrCode;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  },

  setCurrentForm: (form) => {
    set({ currentForm: form });
  },
}));