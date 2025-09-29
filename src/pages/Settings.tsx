import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Shield, Users, UserRound } from 'lucide-react';
import { useAccountStore } from '../store/accountStore';

export function Settings() {
  const [activeTab, setActiveTab] = useState('rules');
  const navigate = useNavigate();
  const { requestSignout } = useAccountStore();

  const tabs = [
    { id: 'rules', name: 'シフトルール', icon: Shield },
    { id: 'notifications', name: '通知設定', icon: Bell },
    { id: 'staff', name: 'スタッフ管理', icon: Users },
    { id: 'account', name: 'アカウント設定', icon: UserRound },
  ];

  const handleSignout = async () => {
    await requestSignout();
    navigate('/signin');
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">設定</h1>
        <p className="mt-2 text-gray-600">システム設定とルール管理</p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'rules' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">シフト自動生成ルール</h2>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">組み合わせNG設定</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600">
                    特定のスタッフ同士が同じシフトに入らないよう設定します
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">必須役割配置</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600">
                    各シフトに必ず責任者や上級生が含まれるようにします
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">スキルバランス考慮</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600">
                    新人とベテランのバランスを考慮してシフトを組みます
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">通知設定</h2>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-sm text-gray-700">シフト確定時にメール通知</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm text-gray-700">シフト変更時にLINE通知</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm text-gray-700">締切リマインダーを送信</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">スタッフ管理</h2>
              <p className="text-sm text-gray-600">
                スタッフの登録と管理機能は今後実装予定です。
              </p>
            </div>
          )}

          {activeTab === 'account' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">アカウント設定</h2>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-center">
                    <button className="rounded text-white bg-primary-600 hover:bg-primary-700"
                      onClick={handleSignout}>
                      <div className="w-20 h-10 flex justify-center items-center">
                        {
                          false
                            ? <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
                            : (<>サインアウト</>)
                        }
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}