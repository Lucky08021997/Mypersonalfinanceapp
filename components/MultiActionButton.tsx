import React, { useState } from 'react';
import { Plus, Banknote, Upload, Landmark } from 'lucide-react';

const ActionButton: React.FC<{ action: () => void; label: string; icon: React.ReactNode }> = ({ action, label, icon }) => (
    <div className="flex items-center gap-4">
        <span className="bg-gray-100 dark:bg-gray-900 px-3 py-1.5 rounded-md text-sm font-semibold shadow-md text-gray-700 dark:text-gray-200 whitespace-nowrap">{label}</span>
        <button onClick={action} className="w-14 h-14 rounded-full bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-lg flex items-center justify-center transition-transform transform hover:scale-110" aria-label={label}>
            {icon}
        </button>
    </div>
);


const MultiActionButton: React.FC<{
  onAddTransaction: () => void;
  onImport: () => void;
  onAddAccount: () => void;
}> = ({ onAddTransaction, onImport, onAddAccount }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  
  return (
    <div className="fixed bottom-8 right-8 z-30">
      <div className="relative flex flex-col items-end gap-4">
        {isOpen && (
          <div className="flex flex-col items-end gap-4">
             <ActionButton action={() => { onAddTransaction(); setIsOpen(false); }} label="Quick Add Transaction" icon={<Banknote size={24} />} />
             <ActionButton action={() => { onImport(); setIsOpen(false); }} label="Quick Import" icon={<Upload size={24} />} />
             <ActionButton action={() => { onAddAccount(); setIsOpen(false); }} label="Add Account" icon={<Landmark size={24} />} />
          </div>
        )}
        <button 
          onClick={toggleMenu} 
          className={`w-16 h-16 rounded-full text-white shadow-xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-primary-600 hover:bg-primary-700'}`}
          aria-label="Toggle Actions"
          aria-expanded={isOpen}
        >
          <Plus size={32} className={`transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}/>
        </button>
      </div>
    </div>
  );
};

export default MultiActionButton;