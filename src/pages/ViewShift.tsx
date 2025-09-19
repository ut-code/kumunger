import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { ShiftForm } from '../types';

interface ShiftAssignmentData {
  id: string;
  formId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  form: ShiftForm;
  assignments: {
    id: string;
    slotId: string;
    staffAssignments: {
      id: string;
      staffId: string;
      staffName: string;
      role?: string;
      isConfirmed: boolean;
    }[];
  }[];
}

export function ViewShift() {
  const { assignmentId } = useParams<{ assignmentId: string }>();

  const [assignment, setAssignment] = useState<ShiftAssignmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (assignmentId) {
        try {
          setLoading(true);
          const response = await fetch(`/api/assignments/${assignmentId}`);

          if (response.ok) {
            const assignmentData = await response.json();
            setAssignment(assignmentData);
          } else if (response.status === 404) {
            setError('シフトが見つかりません');
          } else {
            setError('シフトの読み込みに失敗しました');
          }
        } catch (error) {
          console.error('Error loading assignment:', error);
          setError('シフトの読み込みに失敗しました');
        } finally {
          setLoading(false);
        }
      }
    };
    loadData();
  }, [assignmentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">読み込み中...</h2>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">{error || 'シフトが見つかりません'}</h2>
          <p className="mt-2 text-gray-600">URLを確認してください</p>
        </div>
      </div>
    );
  }

  const form = assignment.form;

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{form.title}</h1>
                <p className="mt-1 text-sm text-gray-600">確定シフト表</p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(assignment.status)}
                <div className="text-sm text-gray-500">
                  {format(new Date(form.startDate), 'M月d日', { locale: ja })} - {format(new Date(form.endDate), 'M月d日', { locale: ja })}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {assignment.status !== 'published' ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="text-center">
                  <p className="text-yellow-800 font-medium">まだ公開されていません</p>
                  <p className="text-sm text-yellow-700 mt-1">管理者によるシフト確定をお待ちください</p>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">シフト一覧</h2>
                  <p className="text-sm text-gray-600">
                    緑色のセルが確定したシフトです。詳細な時間や注意事項については別途連絡いたします。
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 border-r">
                          スタッフ名
                        </th>
                        {form.timeSlots.map((slot) => (
                          <th key={slot.id} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px] border-l">
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
                      {(() => {
                        // スタッフ名のリストを作成
                        const allStaff = new Set<string>();
                        assignment.assignments.forEach(assignment => {
                          assignment.staffAssignments.forEach(staff => {
                            allStaff.add(staff.staffName);
                          });
                        });

                        return Array.from(allStaff).map(staffName => (
                          <tr key={staffName}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r">
                              {staffName}
                            </td>
                            {form.timeSlots.map((slot) => {
                              // このスタッフがこのスロットに割り当てられているかチェック
                              const isAssigned = assignment.assignments.some(assignment =>
                                assignment.slotId === slot.id &&
                                assignment.staffAssignments.some(staff => staff.staffName === staffName)
                              );

                              return (
                                <td key={slot.id} className="px-3 py-4 text-center border-l">
                                  <div className={`w-16 h-10 rounded flex items-center justify-center text-xs font-medium mx-auto ${
                                    isAssigned
                                      ? 'bg-green-100 text-green-800 border border-green-200'
                                      : 'bg-gray-50 text-gray-400'
                                  }`}>
                                    {isAssigned ? '✓' : '-'}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">ご注意</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• シフト変更が必要な場合は、管理者にご連絡ください</li>
                    <li>• 遅刻・欠勤の場合は事前に必ずご連絡をお願いします</li>
                    <li>• このシフト表は随時更新される可能性があります</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}