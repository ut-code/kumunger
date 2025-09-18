import { Navigate } from 'react-router-dom';
import { useAccountStore } from '../store/accountStore';
import { useEffect, type ReactElement } from 'react';

export function PrivateRoute({ children }: { children: ReactElement }) {
    const { authenticated, authorize } = useAccountStore();

    useEffect(() => {
        authorize();
    }, []);

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