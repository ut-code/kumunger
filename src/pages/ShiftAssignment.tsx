import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Send, Copy, RotateCcw } from 'lucide-react';
import { useFormStore } from '../store/formStore';
import { useSubmissionStore } from '../store/submissionStore';
import { useAssignmentStore } from '../store/assignmentStore';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { ShiftForm, ShiftSubmission, ShiftAssignment } from '../types';

export function ShiftAssignment() {
  const { id } = useParams<{ id: string }>();
  const { getForm } = useFormStore();
  const { getSubmissionsByForm, fetchSubmissionsByForm } = useSubmissionStore();
  const { 
    getAssignmentByForm, 
    createAssignment, 
    confirmAssignment,
    unpublishAssignment,
    publishAssignment 
  } = useAssignmentStore();
  
  const [form, setForm] = useState<ShiftForm | null>(null);
  const [assignment, setAssignment] = useState<ShiftAssignment | null>(null);
  const [submissions, setSubmissions] = useState<ShiftSubmission[]>([]);
  const [shiftMatrix, setShiftMatrix] = useState<Record<string, Record<string, boolean>>>({});

  useEffect(() => {
    const loadData = async () => {
      if (id) {
        const formData = await getForm(id);
        setForm(formData || null);
        
        if (formData) {
          // Fetch submissions for this form
          await fetchSubmissionsByForm(formData.id);
          const subs = getSubmissionsByForm(formData.id);
          setSubmissions(subs);
          
          // Get or create assignment
          let assignmentData = getAssignmentByForm(formData.id);
          if (!assignmentData) {
            assignmentData = createAssignment(formData.id);
          }
          setAssignment(assignmentData);
          
          // Initialize shift matrix
          initializeShiftMatrix(formData, subs);
        }
      }
    };
    loadData();
  }, [id, getForm, fetchSubmissionsByForm, getSubmissionsByForm, getAssignmentByForm, createAssignment]);

  const initializeShiftMatrix = (formData: ShiftForm, subs: ShiftSubmission[]) => {
    const matrix: Record<string, Record<string, boolean>> = {};
    
    subs.forEach(submission => {
      matrix[submission.staffName] = {};
      
      formData.timeSlots.forEach(slot => {
        const availableSlot = submission.availableSlots.find(
          avail => avail.slotId === slot.id && avail.isAvailable
        );
        // Only initialize cells where staff is available (true = selected for shift)
        if (availableSlot) {
          matrix[submission.staffName][slot.id] = true;
        }
      });
    });
    
    setShiftMatrix(matrix);
  };

  const toggleShiftCell = (staffName: string, slotId: string) => {
    setShiftMatrix(prev => ({
      ...prev,
      [staffName]: {
        ...prev[staffName],
        [slotId]: !prev[staffName][slotId]
      }
    }));
  };

  const handleConfirmShift = () => {
    if (assignment) {
      confirmAssignment(assignment.id);
      setAssignment({ ...assignment, status: 'confirmed' });
    }
  };

  const handleUnpublishShift = () => {
    if (assignment && confirm('シフトの公開を取り消しますか？スタッフは最新のシフトを見ることができなくなります。')) {
      unpublishAssignment(assignment.id);
      setAssignment({ ...assignment, status: 'draft', publishedAt: undefined });
    }
  };

  const handlePublishShift = () => {
    if (assignment) {
      publishAssignment(assignment.id);
      setAssignment({ ...assignment, status: 'published', publishedAt: new Date() });
    }
  };

  const handleCopyStaffUrl = async () => {
    if (assignment) {
      const staffUrl = `${window.location.origin}/shift/${assignment.id}`;
      try {
        await navigator.clipboard.writeText(staffUrl);
        alert('スタッフ向けURLをコピーしました');
      } catch (error) {
        console.error('Failed to copy URL:', error);
        alert('URLのコピーに失敗しました');
      }
    }
  };

  if (!form || !assignment) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">読み込み中...</h2>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">公開済み</span>;
      case 'confirmed':
        return <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">確定済み</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">下書き</span>;
    }
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

      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">シフト調整</h1>
            <p className="mt-1 text-sm text-gray-600">{form.title}</p>
          </div>
          <div className="flex items-center space-x-4">
            {getStatusBadge(assignment.status)}
            <div className="text-sm text-gray-500">
              {submissions.length} 名が回答済み
            </div>
          </div>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">まだ回答がありません</p>
          <p className="text-sm text-gray-500 mt-2">スタッフからの回答を待ってからシフト調整を行ってください</p>
        </div>
      ) : (
        <>
          {/* Shift Assignment Matrix */}
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h2 className="text-lg font-semibold text-gray-900">シフト割り当てマトリックス</h2>
              <p className="text-sm text-gray-600 mt-1">
                青いセルをクリックして最終シフトを決定してください。「OK」の表示があるセルのみ選択可能です。
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                      スタッフ名
                    </th>
                    {form.timeSlots.map((slot) => (
                      <th key={slot.id} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                        <div>
                          {format(new Date(slot.date), 'M/d(E)', { locale: ja })}
                        </div>
                        <div className="font-normal">
                          {slot.startTime}-{slot.endTime}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((submission) => (
                    <tr key={submission.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r">
                        {submission.staffName}
                      </td>
                      {form.timeSlots.map((slot) => {
                        const isAvailable = submission.availableSlots.some(
                          avail => avail.slotId === slot.id && avail.isAvailable
                        );
                        const isSelected = shiftMatrix[submission.staffName]?.[slot.id] || false;
                        
                        return (
                          <td key={slot.id} className="px-3 py-4 text-center">
                            {isAvailable ? (
                              <button
                                onClick={() => toggleShiftCell(submission.staffName, slot.id)}
                                className={`w-16 h-10 rounded text-xs font-medium transition-colors ${
                                  isSelected
                                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                }`}
                              >
                                OK
                              </button>
                            ) : (
                              <div className="w-16 h-10 bg-gray-50 rounded flex items-center justify-center text-gray-300 text-xs">
                                -
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            {assignment.status === 'draft' && (
              <button
                onClick={handleConfirmShift}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Save className="w-4 h-4 mr-2" />
                シフトを確定
              </button>
            )}
            
            {assignment.status === 'confirmed' && (
              <button
                onClick={handlePublishShift}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Send className="w-4 h-4 mr-2" />
                スタッフに公開
              </button>
            )}

            {assignment.status === 'published' && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600">
                    <Send className="w-4 h-4 mr-2" />
                    公開済み
                  </span>
                  <button
                    onClick={handleCopyStaffUrl}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    URLコピー
                  </button>
                  <button
                    onClick={handleUnpublishShift}
                    className="inline-flex items-center px-3 py-2 border border-orange-300 rounded-md text-sm text-orange-700 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    公開取消
                  </button>
                </div>
                <Link
                  to={`/shift/${assignment.id}`}
                  className="text-primary-600 hover:text-primary-700 text-sm"
                >
                  スタッフ向けページを確認 →
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}