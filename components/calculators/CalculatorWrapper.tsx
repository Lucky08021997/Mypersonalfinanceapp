import React from 'react';
import { X } from 'lucide-react';

interface CalculatorWrapperProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}

const CalculatorWrapper: React.FC<CalculatorWrapperProps> = ({ title, onClose, children }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default CalculatorWrapper;
