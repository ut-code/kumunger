import { useState, useRef, useEffect } from 'react';
import { useAccountStore } from '../store/accountStore';
import { Link, useNavigate } from 'react-router-dom';

export function Signin() {
    const navigate = useNavigate();
    const { requestSignin } = useAccountStore();
    const name = useRef<HTMLInputElement>(null);
    const pass = useRef<HTMLInputElement>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (name.current)
            name.current.focus();
    }, []);

    const handleSignin = async () => {
        if (name.current?.value && pass.current?.value) {
            if (await requestSignin(name.current?.value, pass.current?.value))
                navigate('/dashboard');
            else
                setError('ユーザ名かパスワードが間違っています');
        }
        else if (!name.current?.value)
            setError('ユーザ名を入力してください');
        else
            setError('パスワードを入力してください');
    };

    return <div className="bg-white rounded-lg w-screen h-screen shadow p-6 flex items-center justify-center">
        <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4 text-center">組むんジャー</h2>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    ユーザ名
                </label>
                <input
                    type="text" className="w-150 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    onKeyDown={(e) => e.key == 'Enter' && pass.current?.focus()}
                    onChange={() => setError('')}
                    onBlur={() => name.current?.value == '' ? setError('ユーザ名を入力してください') : setError('')}
                    ref={name}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    パスワード
                </label>
                <input
                    type="password" className="w-150 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    onKeyDown={(e) => e.key == 'Enter' && handleSignin()}
                    ref={pass}
                />
            </div>
            <div className='text-xs text-red-500'>{error}</div>
            <div className="flex justify-center">
                <button className="p-2 rounded text-white bg-primary-600 hover:bg-primary-700"
                    onClick={handleSignin}>
                    サインイン
                </button>
            </div>
            <div className="w-full flex justify-center">
                <Link to={'/signup'} className='text-sm text-blue-800'>アカウントを新規作成</Link>
            </div>
        </div>
    </div>;
}