import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, 
  Plus, 
  Trash2, 
  Clock,
  Tag,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useFormStore } from '../store/formStore';
import type { TimeSlot, Question, Role } from '../types';
import { format, addDays, eachDayOfInterval } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export function FormBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { createForm, updateForm, getForm } = useFormStore();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
  });

  const [timeSlotFormData, setTimeSlotFormData] = useState({
    eventStart: '09:00',
    eventEnd: '18:00',
    breaks: [] as { start: string; end: string }[],
    shiftLengthHours: 3,
    staff: 3,
  })

  const [currentStep, setCurrentStep] = useState(0);
  const [timeSlots, setTimeSlots] = useState<Omit<TimeSlot, 'id'>[]>([]);
  const [questions, setQuestions] = useState<Omit<Question, 'id'>[]>([]);
  const [roles, setRoles] = useState<Omit<Role, 'id'>[]>([]);

  useEffect(() => {
    const loadForm = async () => {
      if (id) {
        const existingForm = await getForm(id);
        if (existingForm) {
          setFormData({
            title: existingForm.title,
            description: existingForm.description || '',
            startDate: format(new Date(existingForm.startDate), 'yyyy-MM-dd'),
            endDate: format(new Date(existingForm.endDate), 'yyyy-MM-dd'),
          });
          setTimeSlots(existingForm.timeSlots);
          setQuestions(existingForm.additionalQuestions);
          setRoles(existingForm.requiredRoles);
        }
      }
    };
    loadForm();
  }, [id, getForm]);

  const steps = [
    { name: '基本情報', icon: FileText },
    { name: '時間帯設定', icon: Clock },
    { name: '役割設定', icon: Tag },
    { name: '追加質問', icon: FileText },
  ];

  const handleAddTimeSlot = () => {
    const newSlot: Omit<TimeSlot, 'id'> = {
      date: new Date(formData.startDate),
      startTime: '09:00',
      endTime: '12:00',
      requiredStaff: 3,
      minStaff: 2,
      maxStaff: 5,
    };
    setTimeSlots([...timeSlots, newSlot]);
  };

  const handleAddQuestion = () => {
    const newQuestion: Omit<Question, 'id'> = {
      type: 'text',
      label: '',
      required: false,
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleAddRole = () => {
    const newRole: Omit<Role, 'id'> = {
      name: '',
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
    };
    setRoles([...roles, newRole]);
  };

  const handleGenerateTimeSlots = () => {
    const dates = eachDayOfInterval({
      start: new Date(formData.startDate),
      end: new Date(formData.endDate),
    });

    const slots: Omit<TimeSlot, 'id'>[] = [];
    
    const eventStart = timeSlotFormData.eventStart;
    const eventEnd = timeSlotFormData.eventEnd;
    const breaks = timeSlotFormData.breaks || [];
    const shiftLengthHours = timeSlotFormData.shiftLengthHours;
    const staff = timeSlotFormData.staff;

    dates.forEach(date => {
      let current = new Date(`${date.toDateString()} ${eventStart}`);
      const end = new Date(`${date.toDateString()} ${eventEnd}`);

      while(current < end){
        let slotEnd = new Date(current);
        slotEnd.setHours(slotEnd.getHours() + shiftLengthHours);
        
        if(slotEnd > end){
          slotEnd = end;
        }

        let slotParts: { start: Date; end: Date }[] = [{ start: current, end: slotEnd }];

        breaks.forEach((br: { start: string; end: string }) => {
          const breakStart = new Date(`${date.toDateString()} ${br.start}`);
          const breakEnd = new Date(`${date.toDateString()} ${br.end}`);

          const newParts: { start: Date; end: Date }[] = [];

          slotParts.forEach((part) => {
            if(part.end <= breakStart || part.start >= breakEnd){
              newParts.push(part);
            }
            else{
              if(part.start < breakStart){
                newParts.push({ start: part.start, end: breakStart });
              }
              if(part.end > breakEnd){
                newParts.push({ start: breakEnd, end:part.end });
              }
            }
          });

          slotParts = newParts;
        });

        slotParts.forEach((p) => {
          if(p.start < p.end){
            slots.push({
              date,
              startTime: p.start.toTimeString().slice(0, 5),
              endTime: p.end.toTimeString().slice(0, 5),
              requiredStaff: staff,
              minStaff:2,
              maxStaff:5,
            });
          }
        });

        current = slotEnd;
      }
    });

    setTimeSlots(slots);
  };

  const handleSave = async () => {
    try {
      if (id) {
        await updateForm(id, {
          ...formData,
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate),
          timeSlots: timeSlots.map(slot => ({ ...slot, id: uuidv4() })),
          additionalQuestions: questions.map(q => ({ ...q, id: uuidv4() })),
          requiredRoles: roles.map(r => ({ ...r, id: uuidv4() })),
        });
      } else {
        const newForm = await createForm(formData.title, formData.description);
        // Add time slots, questions, and roles after creation
        if (newForm && newForm.id) {
          await updateForm(newForm.id, {
            startDate: new Date(formData.startDate),
            endDate: new Date(formData.endDate),
            timeSlots: timeSlots.map(slot => ({ ...slot, id: uuidv4() })),
            additionalQuestions: questions.map(q => ({ ...q, id: uuidv4() })),
            requiredRoles: roles.map(r => ({ ...r, id: uuidv4() })),
          });
        }
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to save form:', error);
      alert('フォームの保存に失敗しました。');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {id ? 'フォーム編集' : '新規フォーム作成'}
        </h1>
        <p className="mt-2 text-gray-600">シフト募集フォームを作成します</p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div
              key={step.name}
              className={`flex items-center ${
                index < steps.length - 1 ? 'flex-1' : ''
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  index <= currentStep
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                <step.icon className="w-5 h-5" />
              </div>
              <span className={`ml-2 text-sm font-medium ${
                index <= currentStep ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {step.name}
              </span>
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div className={`h-0.5 ${
                    index < currentStep ? 'bg-primary-600' : 'bg-gray-200'
                  }`} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {currentStep === 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">基本情報</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                フォームタイトル *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="例: 2024年1月シフト募集"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                説明（任意）
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                placeholder="シフトに関する注意事項など"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  開始日 *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  終了日 *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">時間帯設定</h2>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div>
                  <label>開始時間</label>
                  <input
                    type="time"
                    value={timeSlotFormData.eventStart}
                    onChange={(e) =>
                      setTimeSlotFormData({ ...timeSlotFormData, eventStart: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label>終了時間</label>
                  <input
                    type="time"
                    value={timeSlotFormData.eventEnd}
                    onChange={(e) =>
                      setTimeSlotFormData({ ...timeSlotFormData, eventEnd: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label>シフト時間(時間)</label>
                  <input
                    type="number"
                    min={1}
                    value={timeSlotFormData.shiftLengthHours}
                    onChange={(e) =>
                      setTimeSlotFormData({ ...timeSlotFormData, shiftLengthHours: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label>必要人数</label>
                  <input
                    type="number"
                    min={1}
                    value={timeSlotFormData.staff}
                    onChange={(e) =>
                      setTimeSlotFormData({ ...timeSlotFormData, staff: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="space-x-2">
                <button
                  onClick={handleGenerateTimeSlots}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  自動生成
                </button>
                <button
                  onClick={handleAddTimeSlot}
                  className="px-4 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  追加
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {timeSlots.map((slot, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        日付
                      </label>
                      <input
                        type="date"
                        value={format(slot.date, 'yyyy-MM-dd')}
                        onChange={(e) => {
                          const newSlots = [...timeSlots];
                          newSlots[index] = { ...slot, date: new Date(e.target.value) };
                          setTimeSlots(newSlots);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        開始時間
                      </label>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => {
                          const newSlots = [...timeSlots];
                          newSlots[index] = { ...slot, startTime: e.target.value };
                          setTimeSlots(newSlots);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        終了時間
                      </label>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => {
                          const newSlots = [...timeSlots];
                          newSlots[index] = { ...slot, endTime: e.target.value };
                          setTimeSlots(newSlots);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        必要人数
                      </label>
                      <input
                        type="number"
                        value={slot.requiredStaff}
                        onChange={(e) => {
                          const newSlots = [...timeSlots];
                          newSlots[index] = { ...slot, requiredStaff: parseInt(e.target.value) };
                          setTimeSlots(newSlots);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setTimeSlots(timeSlots.filter((_, i) => i !== index));
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">役割設定</h2>
              <button
                onClick={handleAddRole}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                追加
              </button>
            </div>
            
            <div className="space-y-4">
              {roles.map((role, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        役割名
                      </label>
                      <input
                        type="text"
                        value={role.name}
                        onChange={(e) => {
                          const newRoles = [...roles];
                          newRoles[index] = { ...role, name: e.target.value };
                          setRoles(newRoles);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="例: リーダー、新人"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        色
                      </label>
                      <input
                        type="color"
                        value={role.color}
                        onChange={(e) => {
                          const newRoles = [...roles];
                          newRoles[index] = { ...role, color: e.target.value };
                          setRoles(newRoles);
                        }}
                        className="w-full h-10 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setRoles(roles.filter((_, i) => i !== index));
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">追加質問</h2>
              <button
                onClick={handleAddQuestion}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                追加
              </button>
            </div>
            
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          質問文
                        </label>
                        <input
                          type="text"
                          value={question.label}
                          onChange={(e) => {
                            const newQuestions = [...questions];
                            newQuestions[index] = { ...question, label: e.target.value };
                            setQuestions(newQuestions);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="例: 希望する役割"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          種類
                        </label>
                        <select
                          value={question.type}
                          onChange={(e) => {
                            const newQuestions = [...questions];
                            newQuestions[index] = { 
                              ...question, 
                              type: e.target.value as Question['type']
                            };
                            setQuestions(newQuestions);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="text">テキスト</option>
                          <option value="select">選択式</option>
                          <option value="multiselect">複数選択</option>
                          <option value="textarea">長文</option>
                        </select>
                      </div>
                    </div>
                    
                    {(question.type === 'select' || question.type === 'multiselect') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          選択肢（カンマ区切り）
                        </label>
                        <input
                          type="text"
                          value={question.options?.join(', ') || ''}
                          onChange={(e) => {
                            const newQuestions = [...questions];
                            newQuestions[index] = { 
                              ...question, 
                              options: e.target.value.split(',').map(o => o.trim())
                            };
                            setQuestions(newQuestions);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="例: リーダー, サブリーダー, メンバー"
                        />
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(e) => {
                            const newQuestions = [...questions];
                            newQuestions[index] = { ...question, required: e.target.checked };
                            setQuestions(newQuestions);
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">必須項目</span>
                      </label>
                      <button
                        onClick={() => {
                          setQuestions(questions.filter((_, i) => i !== index));
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 inline mr-1" />
            前へ
          </button>
          
          <div className="space-x-3">
            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => {
                  if (currentStep === 0 && formData.title.trim() === '') {
                    alert('フォームタイトルを入力してください');
                    return;
                  }
                  setCurrentStep(currentStep + 1)
                }}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                次へ
                <ChevronRight className="w-4 h-4 inline ml-1" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="px-6 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                <Save className="w-4 h-4 inline mr-1" />
                保存
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}