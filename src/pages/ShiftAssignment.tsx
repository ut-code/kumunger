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

          // Try to get existing assignment from server first
          try {
            const response = await fetch(`/api/forms/${formData.id}/assignment`);
            if (response.ok) {
              const existingAssignment = await response.json();
              // Convert server assignment to local format
              const localAssignment = {
                id: existingAssignment.id,
                formId: existingAssignment.formId,
                assignments: existingAssignment.assignments,
                status: existingAssignment.status,
                createdAt: new Date(existingAssignment.createdAt),
                updatedAt: new Date(existingAssignment.updatedAt),
                publishedAt: existingAssignment.publishedAt ? new Date(existingAssignment.publishedAt) : undefined
              };
              setAssignment(localAssignment);

              // Initialize matrix from existing assignment data
              if (existingAssignment.assignments.length > 0) {
                const matrix: Record<string, Record<string, boolean>> = {};
                subs.forEach(submission => {
                  matrix[submission.staffName] = {};
                  formData.timeSlots.forEach(slot => {
                    const isAssigned = existingAssignment.assignments.some((assignment: any) =>
                      assignment.slotId === slot.id &&
                      assignment.staffAssignments.some((staff: any) => staff.staffName === submission.staffName)
                    );
                    matrix[submission.staffName][slot.id] = isAssigned;
                  });
                });
                setShiftMatrix(matrix);
              } else {
                initializeShiftMatrix(formData, subs);
              }
            } else {
              // Create new assignment if not found
              let assignmentData = getAssignmentByForm(formData.id);
              if (!assignmentData) {
                assignmentData = createAssignment(formData.id);
              }
              setAssignment(assignmentData);
              initializeShiftMatrix(formData, subs);
            }
          } catch (error) {
            console.error('Error fetching assignment:', error);
            // Fallback to local assignment
            let assignmentData = getAssignmentByForm(formData.id);
            if (!assignmentData) {
              assignmentData = createAssignment(formData.id);
            }
            setAssignment(assignmentData);
            initializeShiftMatrix(formData, subs);
          }
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

  const handleConfirmShift = async () => {
    if (assignment && form) {
      try {
        // マトリックスデータをAPIに送信可能な形式に変換
        const assignmentData = Object.entries(shiftMatrix)
          .flatMap(([staffName, slots]) =>
            Object.entries(slots)
              .filter(([, isSelected]) => isSelected)
              .map(([slotId]) => ({
                slotId,
                staffAssignments: [{
                  staffId: staffName, // スタッフ名をIDとして使用
                  staffName,
                  isConfirmed: true
                }]
              }))
          );

        // サーバーにシフト確定データを送信
        const response = await fetch('/api/assignments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            formId: form.id,
            assignments: assignmentData,
            status: 'confirmed'
          }),
        });

        if (response.ok) {
          const savedAssignment = await response.json();
          // サーバーから返されたassignmentのIDでローカル状態を更新
          const updatedAssignment = {
            ...assignment,
            id: savedAssignment.id, // 重要: サーバーのIDを使用
            status: 'confirmed' as const
          };
          confirmAssignment(assignment.id);
          setAssignment(updatedAssignment);
        } else {
          throw new Error('Failed to save assignment');
        }
      } catch (error) {
        console.error('Error confirming shift:', error);
        alert('シフト確定に失敗しました。もう一度お試しください。');
      }
    }
  };

  const handleUnpublishShift = async () => {
    if (assignment && confirm('シフトの公開を取り消しますか？スタッフは最新のシフトを見ることができなくなります。')) {
      try {
        const response = await fetch(`/api/assignments/${assignment.id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'confirmed' }),
        });

        if (response.ok) {
          const updatedAssignment = await response.json();
          unpublishAssignment(assignment.id);
          setAssignment({
            ...assignment,
            id: updatedAssignment.id, // 最新のIDを保持
            status: 'confirmed' as const,
            publishedAt: undefined
          });
        } else {
          throw new Error('Failed to unpublish assignment');
        }
      } catch (error) {
        console.error('Error unpublishing shift:', error);
        alert('公開取消に失敗しました。もう一度お試しください。');
      }
    }
  };

  const handlePublishShift = async () => {
    if (assignment) {
      try {
        const response = await fetch(`/api/assignments/${assignment.id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'published' }),
        });

        if (response.ok) {
          const updatedAssignment = await response.json();
          publishAssignment(assignment.id);
          setAssignment({
            ...assignment,
            id: updatedAssignment.id, // 最新のIDを保持
            status: 'published' as const,
            publishedAt: new Date(updatedAssignment.publishedAt)
          });
        } else {
          throw new Error('Failed to publish assignment');
        }
      } catch (error) {
        console.error('Error publishing shift:', error);
        alert('公開に失敗しました。もう一度お試しください。');
      }
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