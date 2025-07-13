import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import AuthLayout from './AuthLayout';
import { CheckCircle, XCircle } from 'lucide-react';

interface RegisterPageProps {
    onSwitchToLogin: () => void;
}

const PasswordRequirement: React.FC<{ isValid: boolean; text: string }> = ({ isValid, text }) => (
    <li className={`flex items-center gap-2 text-sm ${isValid ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
        {isValid ? <CheckCircle size={16} /> : <XCircle size={16} />}
        <span>{text}</span>
    </li>
);

const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
    const { register, addNotification } = useAppContext();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const passwordValidation = useMemo(() => {
        const hasLength = password.length >= 8;
        const hasNumber = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const passwordsMatch = password && password === confirmPassword;
        const allValid = hasLength && hasNumber && hasSpecialChar && passwordsMatch;
        return { hasLength, hasNumber, hasSpecialChar, passwordsMatch, allValid };
    }, [password, confirmPassword]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!passwordValidation.allValid) {
            if (password !== confirmPassword) {
                 addNotification('Passwords do not match.', 'error');
            } else {
                 addNotification('Please ensure your password meets all requirements.', 'error');
            }
            return;
        }

        setIsLoading(true);
        const success = await register(name, email, password);
        if (!success) {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout title="Create Account">
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                    <input
                        type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required
                        className="mt-1 block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
                <div>
                    <label htmlFor="email"
                           className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                    <input
                        type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                        className="mt-1 block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
                <div>
                    <label htmlFor="password"
                           className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                    <input
                        type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                        className="mt-1 block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
                <div>
                    <label htmlFor="confirm-password"
                           className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                    <input
                        type="password" id="confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                        className="mt-1 block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <ul className="space-y-1">
                        <PasswordRequirement isValid={passwordValidation.hasLength} text="At least 8 characters long" />
                        <PasswordRequirement isValid={passwordValidation.hasNumber} text="Contains at least one number" />
                        <PasswordRequirement isValid={passwordValidation.hasSpecialChar} text="Contains a special character" />
                        <PasswordRequirement isValid={passwordValidation.passwordsMatch} text="Passwords match" />
                    </ul>
                </div>
                
                <div>
                    <button
                        type="submit" disabled={isLoading || !passwordValidation.allValid}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 dark:disabled:bg-primary-800 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Creating account...' : 'Create Account'}
                    </button>
                </div>
            </form>
             <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <button onClick={onSwitchToLogin} className="font-medium text-primary-600 hover:text-primary-500">
                    Sign in
                </button>
            </p>
        </AuthLayout>
    );
};

export default RegisterPage;