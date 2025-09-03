import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useFormStore } from '../store/formStore';
import { useSubmissionStore } from '../store/submissionStore';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { ShiftForm } from '../types';

export function Submissions() {
  const { id } = useParams<{ id: string }>();
  const { getForm } = useFormStore();
  const { getSubmissionsByForm, fetchSubmissionsByForm } = useSubmissionStore();
  
  const [form, setForm] = useState<ShiftForm | null>(null);

  useEffect(() => {
    const loadFormAndSubmissions = async () => {
      if (id) {
        const formData = await getForm(id);
        setForm(formData || null);
        
        if (formData) {
          await fetchSubmissionsByForm(formData.id);
        }
      }
    };
    loadFormAndSubmissions();
  }, [id, getForm, fetchSubmissionsByForm]);

  const submissions = form ? getSubmissionsByForm(form.id) : [];

  if (!form) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">フォームが見つかりません</h2>
        </div>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold text-gray-900">回答一覧</h1>
              <p className="mt-1 text-sm text-gray-600">{form.title}</p>
            </div>
            <div className="text-lg font-semibold text-primary-600">
              {submissions.length} 件
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  名前
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  メール
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  電話番号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  出勤可能数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  提出日時
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {submissions.map((submission) => (
                <tr key={submission.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {submission.staffName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.phoneNumber || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {submission.availableSlots.filter(s => s.isAvailable).length} / {form.timeSlots.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(submission.submittedAt, 'M月d日 HH:mm', { locale: ja })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}