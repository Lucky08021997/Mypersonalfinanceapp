import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import AuthLayout from './AuthLayout';

interface LoginPageProps {
    onSwitchToRegister: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
    const { login, addNotification } = useAppContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const success = await login(email, password);
        if (!success) {
            setIsLoading(false);
        }
        // On success, the component will unmount, so no need to set isLoading to false.
    };

    return (
        <AuthLayout title="Sign In">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="mt-1 block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
                <div>
                    <label htmlFor="password"
                           className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="mt-1 block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
                <div className="flex items-center justify-end">
                    <div className="text-sm">
                        <a href="#" onClick={(e) => { e.preventDefault(); addNotification('Forgot Password feature is not implemented in this demo.', 'info'); }} className="font-medium text-primary-600 hover:text-primary-500">
                            Forgot your password?
                        </a>
                    </div>
                </div>
                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400"
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </div>
            </form>
            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                Not a member?{' '}
                <button onClick={onSwitchToRegister} className="font-medium text-primary-600 hover:text-primary-500">
                    Create an account
                </button>
            </p>
        </AuthLayout>
    );
};

export default LoginPage;