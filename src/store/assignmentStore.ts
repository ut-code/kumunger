import { create } from 'zustand';
import type { ShiftAssignment, StaffAssignment, ShiftRule } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AssignmentStore {
  assignments: ShiftAssignment[];
  rules: ShiftRule[];
  currentAssignment: ShiftAssignment | null;
  
  createAssignment: (formId: string) => ShiftAssignment;
  updateAssignment: (id: string, updates: Partial<ShiftAssignment>) => void;
  deleteAssignment: (id: string) => void;
  getAssignment: (id: string) => ShiftAssignment | undefined;
  getAssignmentByForm: (formId: string) => ShiftAssignment | undefined;
  setCurrentAssignment: (assignment: ShiftAssignment | null) => void;
  
  assignStaff: (assignmentId: string, slotId: string, staff: StaffAssignment) => void;
  removeStaffFromSlot: (assignmentId: string, slotId: string, staffId: string) => void;
  updateStaffAssignment: (assignmentId: string, slotId: string, staffId: string, updates: Partial<StaffAssignment>) => void;
  
  confirmAssignment: (assignmentId: string) => void;
  unpublishAssignment: (assignmentId: string) => void;
  publishAssignment: (assignmentId: string) => void;
  
  addRule: (rule: Omit<ShiftRule, 'id'>) => void;
  updateRule: (id: string, updates: Partial<ShiftRule>) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string) => void;
  
  autoGenerateAssignments: (formId: string) => ShiftAssignment;
  validateAssignments: (assignmentId: string) => { valid: boolean; violations: string[] };
}

export const useAssignmentStore = create<AssignmentStore>((set, get) => ({
  assignments: [],
  rules: [],
  currentAssignment: null,
  
  createAssignment: (formId) => {
    const newAssignment: ShiftAssignment = {
      id: uuidv4(),
      formId,
      assignments: [],
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    set((state) => ({
      assignments: [...state.assignments, newAssignment],
      currentAssignment: newAssignment,
    }));
    
    return newAssignment;
  },
  
  updateAssignment: (id, updates) => {
    set((state) => ({
      assignments: state.assignments.map((assignment) =>
        assignment.id === id
          ? { ...assignment, ...updates, updatedAt: new Date() }
          : assignment
      ),
      currentAssignment:
        state.currentAssignment?.id === id
          ? { ...state.currentAssignment, ...updates, updatedAt: new Date() }
          : state.currentAssignment,
    }));
  },
  
  deleteAssignment: (id) => {
    set((state) => ({
      assignments: state.assignments.filter((assignment) => assignment.id !== id),
      currentAssignment:
        state.currentAssignment?.id === id ? null : state.currentAssignment,
    }));
  },
  
  getAssignment: (id) => {
    return get().assignments.find((assignment) => assignment.id === id);
  },
  
  getAssignmentByForm: (formId) => {
    return get().assignments.find((assignment) => assignment.formId === formId);
  },
  
  setCurrentAssignment: (assignment) => {
    set({ currentAssignment: assignment });
  },
  
  assignStaff: (assignmentId, slotId, staff) => {
    set((state) => ({
      assignments: state.assignments.map((assignment) => {
        if (assignment.id !== assignmentId) return assignment;
        
        const existingSlot = assignment.assignments.find(
          (a) => a.slotId === slotId
        );
        
        if (existingSlot) {
          return {
            ...assignment,
            assignments: assignment.assignments.map((a) =>
              a.slotId === slotId
                ? {
                    ...a,
                    staffAssignments: [...a.staffAssignments, staff],
                  }
                : a
            ),
            updatedAt: new Date(),
          };
        } else {
          return {
            ...assignment,
            assignments: [
              ...assignment.assignments,
              {
                slotId,
                staffAssignments: [staff],
              },
            ],
            updatedAt: new Date(),
          };
        }
      }),
    }));
  },
  
  removeStaffFromSlot: (assignmentId, slotId, staffId) => {
    set((state) => ({
      assignments: state.assignments.map((assignment) =>
        assignment.id === assignmentId
          ? {
              ...assignment,
              assignments: assignment.assignments.map((a) =>
                a.slotId === slotId
                  ? {
                      ...a,
                      staffAssignments: a.staffAssignments.filter(
                        (s) => s.staffId !== staffId
                      ),
                    }
                  : a
              ),
              updatedAt: new Date(),
            }
          : assignment
      ),
    }));
  },
  
  updateStaffAssignment: (assignmentId, slotId, staffId, updates) => {
    set((state) => ({
      assignments: state.assignments.map((assignment) =>
        assignment.id === assignmentId
          ? {
              ...assignment,
              assignments: assignment.assignments.map((a) =>
                a.slotId === slotId
                  ? {
                      ...a,
                      staffAssignments: a.staffAssignments.map((s) =>
                        s.staffId === staffId ? { ...s, ...updates } : s
                      ),
                    }
                  : a
              ),
              updatedAt: new Date(),
            }
          : assignment
      ),
    }));
  },
  
  confirmAssignment: (assignmentId) => {
    set((state) => ({
      assignments: state.assignments.map((assignment) =>
        assignment.id === assignmentId
          ? {
              ...assignment,
              status: 'confirmed',
              updatedAt: new Date(),
            }
          : assignment
      ),
    }));
  },
  
  unpublishAssignment: (assignmentId) => {
    set((state) => ({
      assignments: state.assignments.map((assignment) =>
        assignment.id === assignmentId
          ? {
              ...assignment,
              status: 'draft',
              publishedAt: undefined,
              updatedAt: new Date(),
            }
          : assignment
      ),
    }));
  },
  
  publishAssignment: (assignmentId) => {
    set((state) => ({
      assignments: state.assignments.map((assignment) =>
        assignment.id === assignmentId
          ? {
              ...assignment,
              status: 'published',
              publishedAt: new Date(),
              updatedAt: new Date(),
            }
          : assignment
      ),
    }));
  },
  
  addRule: (rule) => {
    const newRule: ShiftRule = {
      ...rule,
      id: uuidv4(),
    };
    
    set((state) => ({
      rules: [...state.rules, newRule],
    }));
  },
  
  updateRule: (id, updates) => {
    set((state) => ({
      rules: state.rules.map((rule) =>
        rule.id === id ? { ...rule, ...updates } : rule
      ),
    }));
  },
  
  deleteRule: (id) => {
    set((state) => ({
      rules: state.rules.filter((rule) => rule.id !== id),
    }));
  },
  
  toggleRule: (id) => {
    set((state) => ({
      rules: state.rules.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      ),
    }));
  },
  
  autoGenerateAssignments: (formId) => {
    // This is a placeholder for the auto-generation algorithm
    // In a real implementation, this would use the rules and submissions
    // to generate optimal assignments
    const newAssignment = get().createAssignment(formId);
    
    // TODO: Implement actual auto-generation logic
    
    return newAssignment;
  },
  
  validateAssignments: (assignmentId) => {
    const assignment = get().getAssignment(assignmentId);
    const violations: string[] = [];
    
    if (!assignment) {
      return { valid: false, violations: ['Assignment not found'] };
    }
    
    // TODO: Implement actual validation logic based on rules
    
    return { valid: violations.length === 0, violations };
  },
}));