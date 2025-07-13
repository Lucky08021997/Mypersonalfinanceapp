import React from 'react';
import { X, Calculator } from 'lucide-react';
import CalculatorsView from './CalculatorsView';

interface CalculatorsModalProps {
    onClose: () => void;
}

const CalculatorsModal: React.FC<CalculatorsModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-2xl font-bold flex items-center gap-2"><Calculator size={24}/> Financial Tools</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <X size={24} />
                    </button>
                </div>
                <div className="flex-grow p-6 overflow-y-auto">
                    <CalculatorsView />
                </div>
            </div>
        </div>
    );
};

export default CalculatorsModal;
