import { useState } from 'react';
import { Plus, Trash2, FileText } from 'lucide-react';
import { useFormStore } from '../store/formStore';

export function Templates() {
  const { templates, createTemplate, deleteTemplate } = useFormStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
  });

  const handleCreateTemplate = () => {
    createTemplate({
      name: newTemplate.name,
      description: newTemplate.description,
      timeSlots: [],
      additionalQuestions: [],
      requiredRoles: [],
    });
    setNewTemplate({ name: '', description: '' });
    setShowCreateModal(false);
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">テンプレート</h1>
        <p className="mt-2 text-gray-600">よく使うフォーム設定を保存</p>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          新規テンプレート
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <FileText className="h-8 w-8 text-primary-600" />
                <button
                  onClick={() => deleteTemplate(template.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {template.name}
              </h3>
              {template.description && (
                <p className="text-sm text-gray-600">{template.description}</p>
              )}
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="col-span-full">
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">テンプレートがありません</h3>
              <p className="mt-1 text-sm text-gray-500">
                よく使う設定をテンプレートとして保存できます
              </p>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">新規テンプレート</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  テンプレート名
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  説明（任意）
                </label>
                <textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleCreateTemplate}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                作成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}