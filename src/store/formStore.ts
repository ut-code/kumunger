import { create } from 'zustand';
import type { ShiftForm, Question, Role, TimeSlot, Template } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface FormStore {
  forms: ShiftForm[];
  templates: Template[];
  currentForm: ShiftForm | null;
  
  createForm: (form: Partial<ShiftForm>) => ShiftForm;
  updateForm: (id: string, updates: Partial<ShiftForm>) => void;
  deleteForm: (id: string) => void;
  getForm: (id: string) => ShiftForm | undefined;
  setCurrentForm: (form: ShiftForm | null) => void;
  
  addTimeSlot: (formId: string, slot: Omit<TimeSlot, 'id'>) => void;
  updateTimeSlot: (formId: string, slotId: string, updates: Partial<TimeSlot>) => void;
  deleteTimeSlot: (formId: string, slotId: string) => void;
  
  addQuestion: (formId: string, question: Omit<Question, 'id'>) => void;
  updateQuestion: (formId: string, questionId: string, updates: Partial<Question>) => void;
  deleteQuestion: (formId: string, questionId: string) => void;
  
  addRole: (formId: string, role: Omit<Role, 'id'>) => void;
  updateRole: (formId: string, roleId: string, updates: Partial<Role>) => void;
  deleteRole: (formId: string, roleId: string) => void;
  
  createTemplate: (template: Omit<Template, 'id' | 'createdAt'>) => void;
  deleteTemplate: (id: string) => void;
  applyTemplate: (formId: string, templateId: string) => void;
  
  generateShareUrl: (formId: string) => string;
  generateQRCode: (formId: string) => Promise<string>;
}

export const useFormStore = create<FormStore>((set, get) => ({
  forms: [],
  templates: [],
  currentForm: null,
  
  createForm: (formData) => {
    const newForm: ShiftForm = {
      id: uuidv4(),
      title: formData.title || '新しいシフト募集',
      description: formData.description,
      startDate: formData.startDate || new Date(),
      endDate: formData.endDate || new Date(),
      timeSlots: formData.timeSlots || [],
      additionalQuestions: formData.additionalQuestions || [],
      requiredRoles: formData.requiredRoles || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      ...formData,
    };
    
    set((state) => ({
      forms: [...state.forms, newForm],
      currentForm: newForm,
    }));
    
    return newForm;
  },
  
  updateForm: (id, updates) => {
    set((state) => ({
      forms: state.forms.map((form) =>
        form.id === id
          ? { ...form, ...updates, updatedAt: new Date() }
          : form
      ),
      currentForm: state.currentForm?.id === id
        ? { ...state.currentForm, ...updates, updatedAt: new Date() }
        : state.currentForm,
    }));
  },
  
  deleteForm: (id) => {
    set((state) => ({
      forms: state.forms.filter((form) => form.id !== id),
      currentForm: state.currentForm?.id === id ? null : state.currentForm,
    }));
  },
  
  getForm: (id) => {
    return get().forms.find((form) => form.id === id);
  },
  
  setCurrentForm: (form) => {
    set({ currentForm: form });
  },
  
  addTimeSlot: (formId, slot) => {
    const newSlot: TimeSlot = {
      ...slot,
      id: uuidv4(),
    };
    
    set((state) => ({
      forms: state.forms.map((form) =>
        form.id === formId
          ? {
              ...form,
              timeSlots: [...form.timeSlots, newSlot],
              updatedAt: new Date(),
            }
          : form
      ),
    }));
  },
  
  updateTimeSlot: (formId, slotId, updates) => {
    set((state) => ({
      forms: state.forms.map((form) =>
        form.id === formId
          ? {
              ...form,
              timeSlots: form.timeSlots.map((slot) =>
                slot.id === slotId ? { ...slot, ...updates } : slot
              ),
              updatedAt: new Date(),
            }
          : form
      ),
    }));
  },
  
  deleteTimeSlot: (formId, slotId) => {
    set((state) => ({
      forms: state.forms.map((form) =>
        form.id === formId
          ? {
              ...form,
              timeSlots: form.timeSlots.filter((slot) => slot.id !== slotId),
              updatedAt: new Date(),
            }
          : form
      ),
    }));
  },
  
  addQuestion: (formId, question) => {
    const newQuestion: Question = {
      ...question,
      id: uuidv4(),
    };
    
    set((state) => ({
      forms: state.forms.map((form) =>
        form.id === formId
          ? {
              ...form,
              additionalQuestions: [...form.additionalQuestions, newQuestion],
              updatedAt: new Date(),
            }
          : form
      ),
    }));
  },
  
  updateQuestion: (formId, questionId, updates) => {
    set((state) => ({
      forms: state.forms.map((form) =>
        form.id === formId
          ? {
              ...form,
              additionalQuestions: form.additionalQuestions.map((q) =>
                q.id === questionId ? { ...q, ...updates } : q
              ),
              updatedAt: new Date(),
            }
          : form
      ),
    }));
  },
  
  deleteQuestion: (formId, questionId) => {
    set((state) => ({
      forms: state.forms.map((form) =>
        form.id === formId
          ? {
              ...form,
              additionalQuestions: form.additionalQuestions.filter(
                (q) => q.id !== questionId
              ),
              updatedAt: new Date(),
            }
          : form
      ),
    }));
  },
  
  addRole: (formId, role) => {
    const newRole: Role = {
      ...role,
      id: uuidv4(),
    };
    
    set((state) => ({
      forms: state.forms.map((form) =>
        form.id === formId
          ? {
              ...form,
              requiredRoles: [...form.requiredRoles, newRole],
              updatedAt: new Date(),
            }
          : form
      ),
    }));
  },
  
  updateRole: (formId, roleId, updates) => {
    set((state) => ({
      forms: state.forms.map((form) =>
        form.id === formId
          ? {
              ...form,
              requiredRoles: form.requiredRoles.map((role) =>
                role.id === roleId ? { ...role, ...updates } : role
              ),
              updatedAt: new Date(),
            }
          : form
      ),
    }));
  },
  
  deleteRole: (formId, roleId) => {
    set((state) => ({
      forms: state.forms.map((form) =>
        form.id === formId
          ? {
              ...form,
              requiredRoles: form.requiredRoles.filter(
                (role) => role.id !== roleId
              ),
              updatedAt: new Date(),
            }
          : form
      ),
    }));
  },
  
  createTemplate: (template) => {
    const newTemplate: Template = {
      ...template,
      id: uuidv4(),
      createdAt: new Date(),
    };
    
    set((state) => ({
      templates: [...state.templates, newTemplate],
    }));
  },
  
  deleteTemplate: (id) => {
    set((state) => ({
      templates: state.templates.filter((template) => template.id !== id),
    }));
  },
  
  applyTemplate: (formId, templateId) => {
    const template = get().templates.find((t) => t.id === templateId);
    if (!template) return;
    
    set((state) => ({
      forms: state.forms.map((form) =>
        form.id === formId
          ? {
              ...form,
              additionalQuestions: template.additionalQuestions.map((q) => ({
                ...q,
                id: uuidv4(),
              })),
              requiredRoles: template.requiredRoles,
              updatedAt: new Date(),
            }
          : form
      ),
    }));
  },
  
  generateShareUrl: (formId) => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/submit/${formId}`;
    
    set((state) => ({
      forms: state.forms.map((form) =>
        form.id === formId
          ? { ...form, shareUrl, updatedAt: new Date() }
          : form
      ),
    }));
    
    return shareUrl;
  },
  
  generateQRCode: async (formId) => {
    const QRCode = (await import('qrcode')).default;
    const shareUrl = get().generateShareUrl(formId);
    const qrCode = await QRCode.toDataURL(shareUrl);
    
    set((state) => ({
      forms: state.forms.map((form) =>
        form.id === formId
          ? { ...form, qrCode, updatedAt: new Date() }
          : form
      ),
    }));
    
    return qrCode;
  },
}));