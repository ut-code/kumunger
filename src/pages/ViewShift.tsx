import { useParams } from 'react-router-dom';
import { useAssignmentStore } from '../store/assignmentStore';
import { useFormStore } from '../store/formStore';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export function ViewShift() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { getAssignment } = useAssignmentStore();
  const { getForm } = useFormStore();
  
  const assignment = assignmentId ? getAssignment(assignmentId) : null;
  const form = assignment ? getForm(assignment.formId) : null;

  if (!assignment || !form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">シフトが見つかりません</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">{form.title}</h1>
            <p className="mt-1 text-sm text-gray-600">確定シフト</p>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      日時
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      スタッフ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {form.timeSlots.map((slot) => {
                    const slotAssignment = assignment.assignments.find(a => a.slotId === slot.id);
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
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {slotAssignment?.staffAssignments.map((staff) => (
                              <span
                                key={staff.staffId}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                              >
                                {staff.staffName}
                                {staff.role && ` (${staff.role})`}
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
    </div>
  );
}