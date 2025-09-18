import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Calendar,
  Users,
  ClipboardList,
  Eye,
  Edit,
  Trash2,
  QrCode,
  Share2,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { useFormStore } from '../store/formStore';
import { useSubmissionStore } from '../store/submissionStore';
import { useAssignmentStore } from '../store/assignmentStore';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export function Dashboard() {
  const { forms, fetchForms, deleteForm, generateShareUrl, generateQRCode } = useFormStore();
  const { submissions } = useSubmissionStore();
  const { assignments } = useAssignmentStore();
  const [showQRCode, setShowQRCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const getFormStats = (formId: string) => {
    const formSubmissions = submissions.filter(s => s.formId === formId);
    const formAssignment = assignments.find(a => a.formId === formId);

    return {
      submissions: formSubmissions.length,
      status: formAssignment?.status || 'draft',
    };
  };

  const handleShare = async (formId: string) => {
    const url = await generateShareUrl(formId);
    if (navigator.share) {
      await navigator.share({
        title: 'シフト希望フォーム',
        text: 'シフト希望を提出してください',
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      alert('URLをコピーしました');
    }
  };

  const handleShowQR = async (formId: string) => {
    const qrCode = await generateQRCode(formId);
    setShowQRCode(qrCode);
  };

  const handleDelete = (formId: string) => {
    if (confirm('このフォームを削除してもよろしいですか？')) {
      deleteForm(formId);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            公開済み
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            確定
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock className="w-3 h-3 mr-1" />
            下書き
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="mt-2 text-gray-600">シフト募集の作成と管理</p>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <div className="flex space-x-4">
          <Link
            to="/forms/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            新規作成
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forms.map((form) => {
          const stats = getFormStats(form.id);
          return (
            <div
              key={form.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {form.title}
                  </h3>
                  {getStatusBadge(stats.status)}
                </div>

                {form.description && (
                  <p className="text-sm text-gray-600 mb-4">{form.description}</p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    {format(new Date(form.startDate), 'M月d日', { locale: ja })} - {format(new Date(form.endDate), 'M月d日', { locale: ja })}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="h-4 w-4 mr-2" />
                    {stats.submissions} 件の回答
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <ClipboardList className="h-4 w-4 mr-2" />
                    {form.timeSlots.length} 個の時間帯
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex space-x-2">
                    <Link
                      to={`/forms/${form.id}`}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded"
                      title="詳細"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <Link
                      to={`/forms/${form.id}/edit`}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded"
                      title="編集"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleShare(form.id)}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded"
                      title="共有"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleShowQR(form.id)}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded"
                      title="QRコード"
                    >
                      <QrCode className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => handleDelete(form.id)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                    title="削除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {forms.length === 0 && (
          <div className="col-span-full">
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">フォームがありません</h3>
              <p className="mt-1 text-sm text-gray-500">
                新規作成ボタンから最初のシフト募集を作成しましょう
              </p>
              <div className="mt-6">
                <Link
                  to="/forms/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  新規作成
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {showQRCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <img src={showQRCode} alt="QR Code" className="w-64 h-64" />
            <button
              onClick={() => setShowQRCode(null)}
              className="mt-4 w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}