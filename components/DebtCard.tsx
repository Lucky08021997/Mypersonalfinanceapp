import React, { useMemo, useState } from 'react';
import type { Account, DebtType, Transaction } from '../types';
import { CreditCard, Home, Car, GraduationCap, User, Landmark, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import ConfirmTrashAccountModal from './ConfirmTrashAccountModal';
import { useAppContext } from '../hooks/useAppContext';
import { useCurrency } from '../hooks/useCurrency';

const debtIcons: Record<DebtType, React.ReactNode> = {
    'Personal Loan': <User size={24} />,
    'Credit Card': <CreditCard size={24} />,
    'Home Loan': <Home size={24} />,
    'Auto Loan': <Car size={24} />,
    'Student Loan': <GraduationCap size={24} />,
    'Other': <Landmark size={24} />,
};

interface DebtCardProps {
    account: Account;
    transactions: Transaction[];
    onClick: () => void;
}

const DebtCard: React.FC<DebtCardProps> = ({ account, transactions, onClick }) => {
    const { trashAccount } = useAppContext();
    const { formatCurrency } = useCurrency();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const { balance, initialAmount, amountPaid, progress } = useMemo(() => {
        const balance = transactions.reduce((sum, txn) => sum + txn.amount, 0);
        const openingTxn = transactions.find(t => t.description === 'Opening Balance');
        const initialAmount = Math.abs(openingTxn?.amount || 0);
        const amountPaid = initialAmount > 0 ? initialAmount - Math.abs(balance) : 0;
        const progress = initialAmount > 0 ? (amountPaid / initialAmount) * 100 : 0;
        return { balance, initialAmount, amountPaid, progress };
    }, [transactions]);
    
    const isPaid = balance >= 0;
    const isOverdue = !isPaid && account.dueDate && new Date(account.dueDate) < new Date();

    return (
        <div 
            onClick={onClick}
            className="group relative p-5 rounded-2xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500"
        >
            {isPaid ? (
                <div className="absolute top-3 right-3 text-green-600 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <CheckCircle size={14} /> Paid
                </div>
            ) : isOverdue && (
                <div className="absolute top-3 right-3 text-red-500 bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <AlertTriangle size={14} /> Overdue
                </div>
            )}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">{account.debtType || 'Loan'}</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-1">{account.name}</p>
                </div>
                <div className="text-primary-500 dark:text-primary-400">
                    {account.debtType && debtIcons[account.debtType]}
                </div>
            </div>

            <div className="space-y-1 mb-4">
                <div className="flex justify-between text-sm">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Paid</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Remaining</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${isPaid ? 100 : progress}%` }}></div>
                </div>
                <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-400">
                    <span>{formatCurrency(amountPaid)}</span>
                    <span>{formatCurrency(Math.abs(balance))}</span>
                </div>
            </div>

            <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-1 pt-4 border-t border-gray-200 dark:border-gray-700/50">
                 <div className="font-semibold text-gray-600 dark:text-gray-400">Interest Rate</div>
                 <div className="font-bold text-right text-gray-800 dark:text-gray-200">{account.interestRate ? `${account.interestRate}%` : 'N/A'}</div>
                 
                 <div className="font-semibold text-gray-600 dark:text-gray-400">Installment</div>
                 <div className="font-bold text-right text-gray-800 dark:text-gray-200">{account.installment ? formatCurrency(account.installment) : 'N/A'}</div>
            </div>

            {isPaid && (
                <>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsConfirmOpen(true); }}
                        className="absolute bottom-3 right-3 p-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                        title="Delete Loan"
                    >
                        <Trash2 size={16} />
                    </button>
                    {isConfirmOpen && (
                        <ConfirmTrashAccountModal
                            accountName={account.name}
                            onClose={(e) => {e.stopPropagation(); setIsConfirmOpen(false)}}
                            onConfirm={() => {
                                trashAccount(account.id);
                                setIsConfirmOpen(false);
                            }}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default DebtCard;