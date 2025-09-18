import { useRef } from 'react';
import { useAccountStore } from '../store/accountStore';
import { useNavigate } from 'react-router-dom';

export function Signin() {
    const navigate = useNavigate();
    const { requestSignin } = useAccountStore();
    const name = useRef<HTMLInputElement>(null);
    const pass = useRef<HTMLInputElement>(null);

    const handleSignin = async () => {
        if (name.current?.value && pass.current?.value) {
            if (await requestSignin(name.current?.value, pass.current?.value)) {
                navigate('/dashboard');
            }
        }
    };

    return (
        <>
            Sign in<br />
            <input type="text" ref={name} defaultValue={"Name"}></input><br />
            <input type="text" ref={pass} defaultValue={"Pass"}></input><br />
            <button onClick={handleSignin}>Signin</button>
        </>
    )
}