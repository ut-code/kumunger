import { useRef } from 'react';
import { useAccountStore } from '../store/accountStore';

export function Signup() {
    const { requestSignup } = useAccountStore();
    const name = useRef<HTMLInputElement>(null);
    const pass = useRef<HTMLInputElement>(null);
    const handleSignup = () => {
        if (name.current?.value && pass.current?.value) {
            requestSignup(name.current?.value, pass.current?.value);
        }
    };

    return (
        <>
            Sign up<br />
            <input type="text" ref={name} defaultValue={"Name"}></input><br />
            <input type="text" ref={pass} defaultValue={"Pass"}></input><br />
            <button onClick={handleSignup}>Signup</button>
        </>
    )
}