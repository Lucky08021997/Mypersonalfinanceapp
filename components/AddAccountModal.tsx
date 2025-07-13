import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { AccountTypes, AccountType, DebtTypes, DebtType } from '../types';
import { X } from 'lucide-react';

interface AddAccountModalProps {
  onClose: () => void;
  defaultType?: AccountType;
}

const accountTypeLabels: Record<AccountType, string> = {
    'Bank': 'Bank Account',
    'Credit Card': 'Credit Card',
    'Loan': 'Loan / Debt',
    'Investment': 'Investment',
    'Cash': 'Cash',
};

const AddAccountModal: React.FC<AddAccountModalProps> = ({ onClose, defaultType }) => {
    const { addAccount } = useAppContext();
    const [name, setName] = useState('');
    const [type, setType] = useState<AccountType>(defaultType || 'Bank');
    const [openingBalance, setOpeningBalance] = useState('0');
    const [notes, setNotes] = useState('');

    // Debt specific state
    const [debtType, setDebtType] = useState<DebtType>('Personal Loan');
    const [interestRate, setInterestRate] = useState('');
    const [installment, setInstallment] = useState('');
    const [dueDate, setDueDate] = useState('');

    // Credit Card specific state
    const [creditLimit, setCreditLimit] = useState('');
    const [dueDateDay, setDueDateDay] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert('Account name is required.');
            return;
        }

        const accountData: any = { 
            name: name.trim(), 
            type, 
            notes: notes.trim() 
        };

        if (type === 'Loan') {
            accountData.debtType = debtType;
            accountData.interestRate = parseFloat(interestRate) || undefined;
            accountData.installment = parseFloat(installment) || undefined;
            accountData.dueDate = dueDate ? new Date(dueDate).toISOString() : undefined;
        } else if (type === 'Credit Card') {
            accountData.creditLimit = parseFloat(creditLimit) || undefined;
            accountData.dueDateDay = parseInt(dueDateDay) || undefined;
        }

        addAccount(
            accountData,
            parseFloat(openingBalance) || 0
        );

        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Add New Account</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Name / Lender</label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                placeholder={type === 'Loan' ? "e.g., Main Street Bank" : "e.g., HDFC Salary"}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Type</label>
                                <select
                                    id="type"
                                    value={type}
                                    onChange={(e) => setType(e.target.value as AccountType)}
                                    className="mt-1 block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                >
                                    {AccountTypes.map(accType => (
                                        <option key={accType} value={accType}>{accountTypeLabels[accType]}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="openingBalance" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{type === 'Loan' || type === 'Credit Card' ? 'Current Balance' : 'Opening Balance'}</label>
                                <input
                                    type="number"
                                    id="openingBalance"
                                    value={openingBalance}
                                    onChange={(e) => setOpeningBalance(e.target.value)}
                                    className="mt-1 block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    step="0.01"
                                    placeholder={type === 'Loan' || type === 'Credit Card' ? "Enter as positive number" : ""}
                                />
                            </div>
                        </div>

                        {type === 'Loan' && (
                            <>
                                <hr className="dark:border-gray-700"/>
                                <h4 className="font-semibold">Loan Details</h4>
                                <div>
                                    <label htmlFor="debtType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type of Debt</label>
                                    <select id="debtType" value={debtType} onChange={(e) => setDebtType(e.target.value as DebtType)} className="mt-1 block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                                        {DebtTypes.map(dType => (<option key={dType} value={dType}>{dType}</option>))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Interest Rate (%)</label>
                                        <input type="number" id="interestRate" value={interestRate} onChange={e => setInterestRate(e.target.value)} className="mt-1 block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" step="0.01" placeholder="e.g., 4.5" />
                                    </div>
                                    <div>
                                        <label htmlFor="installment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Payment</label>
                                        <input type="number" id="installment" value={installment} onChange={e => setInstallment(e.target.value)} className="mt-1 block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" step="0.01" placeholder="e.g., 350" />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Next Payment Due Date</label>
                                    <input type="date" id="dueDate" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
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
                                        <input type="number" id="creditLimit" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} className="mt-1 block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" step="0.01" placeholder="e.g., 50000" />
                                    </div>
                                    <div>
                                        <label htmlFor="dueDateDay" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Day of Month</label>
                                        <input type="number" id="dueDateDay" value={dueDateDay} onChange={e => setDueDateDay(e.target.value)} className="mt-1 block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" min="1" max="31" placeholder="e.g., 15" />
                                    </div>
                                </div>
                                <hr className="dark:border-gray-700"/>
                            </>
                        )}
                        
                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes (Optional)</label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="mt-1 block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                placeholder="e.g., Primary salary account"
                            />
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                        <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors">Create Account</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddAccountModal;
