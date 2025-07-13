import React from 'react';

interface CalculatorCardProps {
    title: string;
    description: string;
    icon: React.ElementType;
    onClick: () => void;
}

const CalculatorCard: React.FC<CalculatorCardProps> = ({ title, description, icon: Icon, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="group text-left p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
            <div className="p-3 bg-primary-100 dark:bg-primary-900/50 rounded-lg inline-block mb-4">
                <Icon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{title}</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </button>
    );
};

export default CalculatorCard;
