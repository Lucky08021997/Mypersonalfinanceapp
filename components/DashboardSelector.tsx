
import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Home, LogOut, User } from 'lucide-react';

const DashboardSelector: React.FC = () => {
    const { selectDashboard, logout, state } = useAppContext();

    const SelectorCard: React.FC<{
        title: string;
        description: string;
        icon: React.ReactNode;
        onClick: () => void;
        gradient: string;
    }> = ({ title, description, icon, onClick, gradient }) => (
        <div
            onClick={onClick}
            className={`group w-full md:w-80 h-72 rounded-3xl shadow-lg hover:shadow-2xl cursor-pointer transition-all duration-300 flex flex-col justify-between p-8 transform hover:-translate-y-2 text-white ${gradient}`}
        >
            <div className="flex justify-end">
                <div className="p-3 bg-white/20 rounded-full transition-transform group-hover:scale-110">
                    {icon}
                </div>
            </div>
            <div>
                <h2 className="text-3xl font-bold">{title}</h2>
                <p className="mt-2 text-white/80">{description}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
            <div className="absolute top-6 right-6">
                 <button onClick={logout} className="flex items-center gap-2 text-sm p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <LogOut size={16} /> Logout
                </button>
            </div>
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100">
                    Welcome, <span className="text-primary-600">{state.currentUser?.name}!</span>
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">Choose a dashboard to get started.</p>
            </div>
            <div className="flex flex-col md:flex-row gap-0 items-stretch w-full max-w-5xl shadow-2xl rounded-3xl overflow-hidden">
                <div className="w-full md:w-1/2 p-8 bg-blue-50 dark:bg-gray-800/50 flex flex-col justify-center items-center">
                    <SelectorCard 
                        title="Personal"
                        description="Track your own income, expenses, and budget."
                        icon={<User size={32} />}
                        onClick={() => selectDashboard('personal')}
                        gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
                    />
                </div>
                <div className="w-full md:w-1/2 p-8 bg-green-50 dark:bg-gray-800/50 flex flex-col justify-center items-center">
                    <SelectorCard 
                        title="Home"
                        description="Manage shared family expenses and household budgets."
                        icon={<Home size={32} />}
                        onClick={() => selectDashboard('home')}
                        gradient="bg-gradient-to-br from-green-500 to-teal-600"
                    />
                </div>
            </div>
        </div>
    );
};

export default DashboardSelector;