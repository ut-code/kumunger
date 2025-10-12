import { Navigate } from 'react-router-dom';
import { useAccountStore } from '../store/accountStore';
import { useEffect, type ReactElement } from 'react';

function Loading() {
    return <div className="bg-white rounded-lg w-full h-full shadow p-6 flex items-center justify-center">
        <div className="animate-spin h-20 w-20 border-2 border-primary-600 rounded-full border-t-transparent"></div>
    </div>
}

export function PrivateRoute({ children }: { children: ReactElement }) {
    const { authenticated, pending, authorize } = useAccountStore();

    useEffect(() => {
        authorize();
    }, []);

    if (pending) {
        return <Loading></Loading>
    }

    if (!authenticated) {
        return <Navigate to='/signin' />;
    }

    return children;
}
export function AuthRoute({ children }: { children: ReactElement }) {
    const { authenticated } = useAccountStore();

    if (authenticated) {
        return <Navigate to='/dashboard' />;
    }

    return children;
}