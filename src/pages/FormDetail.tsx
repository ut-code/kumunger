import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Edit, 
  Users, 
  Calendar,
  Share2,
  QrCode,
  ArrowLeft,
  ClipboardList,
  CheckCircle
} from 'lucide-react';
import { useFormStore } from '../store/formStore';
import { useSubmissionStore } from '../store/submissionStore';
import { useAssignmentStore } from '../store/assignmentStore';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export function FormDetail() {
  const { id } = useParams<{ id: string }>();
  const { getForm, generateShareUrl, generateQRCode } = useFormStore();
  const { getSubmissionsByForm } = useSubmissionStore();
  const { getAssignmentByForm } = useAssignmentStore();
  
  const [form, setForm] = useState(id ? getForm(id) : null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeUrl, setQRCodeUrl] = useState('');

  useEffect(() => {
    if (id) {
      const formData = getForm(id);
      setForm(formData);
    }
  }, [id, getForm]);

  if (!form) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">フォームが見つかりません</h2>
          <Link to="/dashboard" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
            ダッシュボードに戻る
          </Link>
        </div>
      </div>
    );
  }

  const submissions = getSubmissionsByForm(form.id);
  const assignment = getAssignmentByForm(form.id);

  const handleShare = async () => {
    const url = generateShareUrl(form.id);
    if (navigator.share) {
      await navigator.share({
        title: form.title,
        text: 'シフト希望を提出してください',
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      alert('URLをコピーしました');
    }
  };

  const handleShowQR = async () => {
    const qrCode = await generateQRCode(form.id);
    setQRCodeUrl(qrCode);
    setShowQRCode(true);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          ダッシュボードに戻る
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{form.title}</h1>
              {form.description && (
                <p className="mt-2 text-gray-600">{form.description}</p>
              )}
              <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {format(form.startDate, 'yyyy年M月d日', { locale: ja })} - 
                  {format(form.endDate, 'yyyy年M月d日', { locale: ja })}
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {submissions.length} 件の回答
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleShare}
                className="px-3 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                <Share2 className="w-4 h-4 inline mr-1" />
                共有
              </button>
              <button
                onClick={handleShowQR}
                className="px-3 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                <QrCode className="w-4 h-4 inline mr-1" />
                QRコード
              </button>
              <Link
                to={`/forms/${form.id}/edit`}
                className="px-3 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                <Edit className="w-4 h-4 inline mr-1" />
                編集
              </Link>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to={`/forms/${form.id}/submissions`}
              className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-primary-500 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">回答一覧</h3>
                  <p className="mt-1 text-3xl font-bold text-primary-600">{submissions.length}</p>
                  <p className="mt-1 text-sm text-gray-500">件の回答</p>
                </div>
                <ClipboardList className="w-12 h-12 text-gray-400" />
              </div>
            </Link>

            <Link
              to={`/forms/${form.id}/assignment`}
              className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-primary-500 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">シフト調整</h3>
                  <p className="mt-1 text-sm font-medium text-gray-700">
                    {assignment?.status === 'published' ? '公開済み' : 
                     assignment?.status === 'confirmed' ? '確定済み' : '未作成'}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">シフトを自動生成・調整</p>
                </div>
                <Calendar className="w-12 h-12 text-gray-400" />
              </div>
            </Link>

            <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">フォーム状態</h3>
                  <p className="mt-1 text-sm font-medium">
                    {form.isActive ? (
                      <span className="inline-flex items-center text-green-700">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        受付中
                      </span>
                    ) : (
                      <span className="text-gray-500">受付終了</span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {form.timeSlots.length} 個の時間帯
                  </p>
                </div>
                <Users className="w-12 h-12 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">時間帯一覧</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      日付
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      必要人数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      回答数
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {form.timeSlots.map((slot) => {
                    const slotSubmissions = submissions.filter(sub =>
                      sub.availableSlots.some(as => as.slotId === slot.id && as.isAvailable)
                    );
                    return (
                      <tr key={slot.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(slot.date, 'M月d日(E)', { locale: ja })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {slot.startTime} - {slot.endTime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {slot.requiredStaff} 人
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`font-medium ${
                            slotSubmissions.length >= slot.requiredStaff
                              ? 'text-green-600'
                              : slotSubmissions.length >= slot.minStaff
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}>
                            {slotSubmissions.length} 人
                          </span>
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

      {showQRCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">QRコード</h3>
            <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
            <p className="mt-4 text-sm text-gray-600 text-center">
              このQRコードをスキャンして<br />シフト希望を提出できます
            </p>
            <button
              onClick={() => setShowQRCode(false)}
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