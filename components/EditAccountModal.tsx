import React, { useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Account, AccountTypes, AccountType, DebtTypes, DebtType } from '../types';
import { X, Save, AlertTriangle } from 'lucide-react';

interface EditAccountModalProps {
  onClose: () => void;
  account: Account;
}

const accountTypeLabels: Record<AccountType, string> = {
    'Bank': 'Bank Account',
    'Credit Card': 'Credit Card',
    'Loan': 'Loan / Debt',
    'Investment': 'Investment',
    'Cash': 'Cash',
};

const EditAccountModal: React.FC<EditAccountModalProps> = ({ onClose, account }) => {
    const { updateAccount, archiveAccount, unarchiveAccount } = useAppContext();
    const [name, setName] = useState(account.name);
    const [type, setType] = useState<AccountType>(account.type);
    const [notes, setNotes] = useState(account.notes || '');

    // Debt specific state
    const [debtType, setDebtType] = useState<DebtType>(account.debtType || 'Personal Loan');
    const [interestRate, setInterestRate] = useState(account.interestRate?.toString() || '');
    const [installment, setInstallment] = useState(account.installment?.toString() || '');
    const [dueDate, setDueDate] = useState(account.dueDate ? account.dueDate.split('T')[0] : '');
    
    // Credit Card specific state
    const [creditLimit, setCreditLimit] = useState(account.creditLimit?.toString() || '');
    const [dueDateDay, setDueDateDay] = useState(account.dueDateDay?.toString() || '');

    const [isArchived, setIsArchived] = useState(account.isArchived || false);
    const [showTypeChangeWarning, setShowTypeChangeWarning] = useState(false);
    
    useEffect(() => {
        if (type !== 'Loan') {
            setDebtType('Personal Loan');
            setInterestRate('');
            setInstallment('');
            setDueDate('');
        }
        if (type !== 'Credit Card') {
            setCreditLimit('');
            setDueDateDay('');
        }
    }, [type]);

    const handleTypeChange = (newType: AccountType) => {
        if (newType !== account.type) {
            setShowTypeChangeWarning(true);
        } else {
            setShowTypeChangeWarning(false);
        }
        setType(newType);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert('Account name is required.');
            return;
        }

        const updatedAccountData: Account = {
            id: account.id,
            name: name.trim(),
            type: type,
            notes: notes.trim() || undefined,
            isArchived,
        };

        if (type === 'Loan') {
            updatedAccountData.debtType = debtType;
            updatedAccountData.interestRate = parseFloat(interestRate) || undefined;
            updatedAccountData.installment = parseFloat(installment) || undefined;
            updatedAccountData.dueDate = dueDate ? new Date(dueDate).toISOString() : undefined;
        } else if (type === 'Credit Card') {
            updatedAccountData.creditLimit = parseFloat(creditLimit) || undefined;
            updatedAccountData.dueDateDay = parseInt(dueDateDay) || undefined;
        }
        
        updateAccount(updatedAccountData);
        onClose();
    };

    const handleArchiveToggle = () => {
        if (isArchived) {
            unarchiveAccount(account.id);
        } else {
            archiveAccount(account.id);
        }
        setIsArchived(!isArchived);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Edit Account</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Name / Lender</label>
                            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full form-input" required />
                        </div>
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Type</label>
                            <select id="type" value={type} onChange={(e) => handleTypeChange(e.target.value as AccountType)} className="mt-1 block w-full form-select" >
                                {AccountTypes.map(accType => (<option key={accType} value={accType}>{accountTypeLabels[accType]}</option>))}
                            </select>
                            {showTypeChangeWarning && (
                                <div className="mt-2 text-xs text-orange-600 dark:text-orange-400 flex items-start gap-2">
                                    <AlertTriangle size={16} className="flex-shrink-0 mt-px"/>
                                    <span>Changing the type may affect how the balance is displayed. Transactions will not be altered.</span>
                                </div>
                            )}
                        </div>

                        {type === 'Loan' && (
                            <>
                                <hr className="dark:border-gray-700"/>
                                <h4 className="font-semibold">Loan Details</h4>
                                <div>
                                    <label htmlFor="debtType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type of Debt</label>
                                    <select id="debtType" value={debtType} onChange={(e) => setDebtType(e.target.value as DebtType)} className="mt-1 block w-full form-select">
                                        {DebtTypes.map(dType => (<option key={dType} value={dType}>{dType}</option>))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Interest Rate (%)</label>
                                        <input type="number" id="interestRate" value={interestRate} onChange={e => setInterestRate(e.target.value)} className="mt-1 block w-full form-input" step="0.01" placeholder="e.g., 4.5" />
                                    </div>
                                    <div>
                                        <label htmlFor="installment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Payment</label>
                                        <input type="number" id="installment" value={installment} onChange={e => setInstallment(e.target.value)} className="mt-1 block w-full form-input" step="0.01" placeholder="e.g., 350" />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Next Payment Due Date</label>
                                    <input type="date" id="dueDate" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 block w-full form-input" />
                                </div>
                                <hr className="dark:border-gray-700"/>
                            </>
                        )}

                        {type === 'Credit Card' && (
                            <>
                                <hr className="dark:border-gray-700"/>
                                <h4 className="font-semibold">Credit Card Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="creditLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Credit Limit</label>
                                        <input type="number" id="creditLimit" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} className="mt-1 block w-full form-input" step="0.01" placeholder="e.g., 50000" />
                                    </div>
                                    <div>
                                        <label htmlFor="dueDateDay" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Day of Month</label>
                                        <input type="number" id="dueDateDay" value={dueDateDay} onChange={e => setDueDateDay(e.target.value)} className="mt-1 block w-full form-input" min="1" max="31" placeholder="e.g., 15" />
                                    </div>
                                </div>
                                <hr className="dark:border-gray-700"/>
                            </>
                        )}
                        
                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes (Optional)</label>
                            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 block w-full form-input" placeholder="e.g., Account notes" />
                        </div>
                        
                        <div className="pt-4 border-t dark:border-gray-700">
                             <label className="flex items-center justify-between cursor-pointer">
                                <span className="font-medium text-gray-700 dark:text-gray-200">Archive Account</span>
                                <div className="relative">
                                    <input type="checkbox" className="sr-only" checked={isArchived} onChange={handleArchiveToggle} />
                                    <div className={`block w-14 h-8 rounded-full ${isArchived ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isArchived ? 'translate-x-6' : ''}`}></div>
                                </div>
                            </label>
                            <p className="text-xs text-gray-500 mt-1">Archived accounts are hidden from dashboards and account selectors.</p>
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                        <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center gap-2">
                           <Save size={18}/> Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditAccountModal;
