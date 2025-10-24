import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Check, Calendar, Clock } from 'lucide-react';
import { useFormStore } from '../store/formStore';
import { useSubmissionStore } from '../store/submissionStore';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { AvailableSlot, ShiftForm } from '../types';

export function SubmitForm() {
  const { formId } = useParams<{ formId: string }>();
  const { getForm } = useFormStore();
  const { submitShift } = useSubmissionStore();
  
  const [form, setForm] = useState<ShiftForm | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    staffName: '',
    email: '',
    phoneNumber: '',
    answers: {} as Record<string, any>,
  });
  const [availability, setAvailability] = useState<Record<string, AvailableSlot>>({});

  useEffect(() => {
    const loadForm = async () => {
      if (formId) {
        const formData = await getForm(formId);
        setForm(formData ?? null);
        
        if (formData) {
          const initialAvailability: Record<string, AvailableSlot> = {};
          formData.timeSlots.forEach(slot => {
            initialAvailability[slot.id] = {
              slotId: slot.id,
              isAvailable: false,
              preferredRoles: [],
              notes: '',
            };
          });
          setAvailability(initialAvailability);
        }
      }
    };
    loadForm();
  }, [formId, getForm]);

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">フォームが見つかりません</h2>
          <p className="mt-2 text-gray-600">URLを確認してください</p>
        </div>
      </div>
    );
  }

  if (!form.isActive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">受付終了</h2>
          <p className="mt-2 text-gray-600">このフォームの受付は終了しました</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const availableSlots = Object.values(availability);
    
    try {
      await submitShift({
        formId: form.id,
        staffName: formData.staffName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        availableSlots,
        answers: formData.answers,
      });
      
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit:', error);
      alert('送信に失敗しました。もう一度お試しください。');
    }
  };

  const toggleAvailability = (slotId: string) => {
    setAvailability(prev => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        isAvailable: !prev[slotId].isAvailable,
      },
    }));
  };

  const updateSlotNotes = (slotId: string, notes: string) => {
    setAvailability(prev => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        notes,
      },
    }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">送信完了</h2>
          <p className="text-gray-600">
            シフト希望を受け付けました。<br />
            確定後にお知らせいたします。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">{form.title}</h1>
            {form.description && (
              <p className="mt-2 text-gray-600">{form.description}</p>
            )}
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <Calendar className="w-4 h-4 mr-1" />
              {format(new Date(form.startDate), 'yyyy年M月d日', { locale: ja })} - 
              {format(new Date(form.endDate), 'yyyy年M月d日', { locale: ja })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    お名前 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.staffName}
                    onChange={(e) => setFormData({ ...formData, staffName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    電話番号
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">出勤可能日時</h3>
              <p className="text-sm text-gray-600 mb-4">出勤可能な時間帯を選択してください</p>
              
              <div className="space-y-3">
                {form.timeSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      availability[slot.id]?.isAvailable
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={slot.id}
                          checked={availability[slot.id]?.isAvailable || false}
                          onChange={() => toggleAvailability(slot.id)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor={slot.id} className="ml-3 cursor-pointer">
                          <div className="font-medium text-gray-900">
                            {format(new Date(slot.date), 'M月d日(E)', { locale: ja })}
                          </div>
                          <div className="text-sm text-gray-600">
                            <Clock className="inline w-3 h-3 mr-1" />
                            {slot.startTime} - {slot.endTime}
                          </div>
                        </label>
                      </div>
                      <div className="text-sm text-gray-500">
                        必要: {slot.requiredStaff}人
                      </div>
                    </div>
                    
                    {availability[slot.id]?.isAvailable && form.requiredRoles.length > 0 && (
                      <div className="mt-3 pl-7">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          希望役割
                        </label>
                        <div className="space-y-2">
                          {form.requiredRoles.map(role => (
                            <label key={role.id} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={availability[slot.id]?.preferredRoles?.includes(role.id) || false}
                                onChange={(e) => {
                                  const current = availability[slot.id]?.preferredRoles || [];
                                  const updated = e.target.checked
                                    ? [...current, role.id]
                                    : current.filter(id => id !== role.id);
                                  setAvailability(prev => ({
                                    ...prev,
                                    [slot.id]: {
                                      ...prev[slot.id],
                                      preferredRoles: updated,
                                    },
                                  }));
                                }}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700">{role.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {availability[slot.id]?.isAvailable && (
                      <div className="mt-3 pl-7">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          備考
                        </label>
                        <input
                          type="text"
                          value={availability[slot.id]?.notes || ''}
                          onChange={(e) => updateSlotNotes(slot.id, e.target.value)}
                          placeholder="遅刻・早退など"
                          className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {form.additionalQuestions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">追加項目</h3>
                <div className="space-y-4">
                  {form.additionalQuestions.map((question) => (
                    <div key={question.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {question.label}
                        {question.required && ' *'}
                      </label>
                      
                      {question.type === 'text' && (
                        <input
                          type="text"
                          required={question.required}
                          value={formData.answers[question.id] || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            answers: { ...formData.answers, [question.id]: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      )}
                      
                      {question.type === 'textarea' && (
                        <textarea
                          required={question.required}
                          value={formData.answers[question.id] || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            answers: { ...formData.answers, [question.id]: e.target.value }
                          })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      )}
                      
                      {question.type === 'select' && (
                        <select
                          required={question.required}
                          value={formData.answers[question.id] || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            answers: { ...formData.answers, [question.id]: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="">選択してください</option>
                          {question.options?.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      )}
                      
                      {question.type === 'multiselect' && (
                        <div className="space-y-2">
                          {question.options?.map(option => (
                            <label key={option} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.answers[question.id]?.includes(option) || false}
                                onChange={(e) => {
                                  const current = formData.answers[question.id] || [];
                                  const updated = e.target.checked
                                    ? [...current, option]
                                    : current.filter((o: string) => o !== option);
                                  setFormData({
                                    ...formData,
                                    answers: { ...formData.answers, [question.id]: updated }
                                  });
                                }}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-6">
              <button
                type="submit"
                className="w-full px-4 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                送信する
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}