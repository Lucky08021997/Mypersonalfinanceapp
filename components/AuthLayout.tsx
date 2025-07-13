import React from 'react';

const AuthLayout: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-slate-900 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-primary-600">Financify</h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">Your finances, simplified and secure.</p>
                </div>
                <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-6">{title}</h2>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
