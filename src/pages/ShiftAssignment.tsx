import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Wand2, Save, Send } from 'lucide-react';
import { useFormStore } from '../store/formStore';
import { useSubmissionStore } from '../store/submissionStore';
import { useAssignmentStore } from '../store/assignmentStore';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export function ShiftAssignment() {
  const { id } = useParams<{ id: string }>();
  const { getForm } = useFormStore();
  const { getSubmissionsByForm } = useSubmissionStore();
  const { 
    getAssignmentByForm, 
    createAssignment, 
    autoGenerateAssignments, 
    confirmAssignment,
    publishAssignment 
  } = useAssignmentStore();
  
  const form = id ? getForm(id) : null;
  const [assignment, setAssignment] = useState(form ? getAssignmentByForm(form.id) : null);
  const submissions = form ? getSubmissionsByForm(form.id) : [];

  useEffect(() => {
    if (form && !assignment) {
      const newAssignment = createAssignment(form.id);
      setAssignment(newAssignment);
    }
  }, [form, assignment]);

  if (!form || !assignment) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">フォームが見つかりません</h2>
        </div>
      </div>
    );
  }

  const handleAutoGenerate = () => {
    const generated = autoGenerateAssignments(form.id);
    setAssignment(generated);
  };

  const handleConfirm = () => {
    confirmAssignment(assignment.id);
    setAssignment({ ...assignment, status: 'confirmed' });
  };

  const handlePublish = () => {
    publishAssignment(assignment.id);
    setAssignment({ ...assignment, status: 'published' });
  };

  const getAssignedStaff = (slotId: string) => {
    const slotAssignment = assignment.assignments.find(a => a.slotId === slotId);
    return slotAssignment?.staffAssignments || [];
  };

  const getAvailableStaff = (slotId: string) => {
    return submissions.filter(sub => 
      sub.availableSlots.some(slot => slot.slotId === slotId && slot.isAvailable)
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link 
          to={`/forms/${form.id}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          フォーム詳細に戻る
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">シフト調整</h1>
              <p className="mt-1 text-sm text-gray-600">{form.title}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleAutoGenerate}
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                <Wand2 className="w-4 h-4 inline mr-1" />
                自動生成
              </button>
              {assignment.status === 'draft' && (
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 inline mr-1" />
                  確定
                </button>
              )}
              {assignment.status === 'confirmed' && (
                <button
                  onClick={handlePublish}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  <Send className="w-4 h-4 inline mr-1" />
                  公開
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    時間帯
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    必要/現在
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    配置スタッフ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    出勤可能者
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {form.timeSlots.map((slot) => {
                  const assigned = getAssignedStaff(slot.id);
                  const available = getAvailableStaff(slot.id);
                  
                  return (
                    <tr key={slot.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {format(slot.date, 'M月d日(E)', { locale: ja })}
                        </div>
                        <div className="text-sm text-gray-500">
                          {slot.startTime} - {slot.endTime}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          assigned.length >= slot.requiredStaff
                            ? 'text-green-600'
                            : assigned.length >= slot.minStaff
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}>
                          {assigned.length} / {slot.requiredStaff}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {assigned.map((staff) => (
                            <span
                              key={staff.staffId}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {staff.staffName}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {available.map((sub) => (
                            <span
                              key={sub.id}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {sub.staffName}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}