
import React, { useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { useCurrency } from '../hooks/useCurrency';
import type { Budget, Transaction, Category } from '../types';
import * as icons from 'lucide-react';
import {
    endOfMonth,
    endOfWeek,
    endOfYear,
    startOfMonth,
    startOfWeek,
    startOfYear,
} from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const DynamicIcon = ({ name, ...props }: { name: string; [key: string]: any }) => {
    const LucideIcon = (icons as any)[name] || icons.Tag;
    return <LucideIcon {...props} />;
};

interface BudgetDetailModalProps {
    budget: Budget;
    onClose: () => void;
}

const BudgetDetailModal: React.FC<BudgetDetailModalProps> = ({ budget, onClose }) => {
    const { activeDashboardData, state } = useAppContext();
    const { formatCurrency } = useCurrency();
    const { transactions, categories, accounts } = activeDashboardData;

    const { linkedTransactions, totalSpent } = useMemo(() => {
        const now = new Date();
        let startDate, endDate;

        switch (budget.period) {
            case 'weekly':
                startDate = startOfWeek(now, { weekStartsOn: 1 });
                endDate = endOfWeek(now, { weekStartsOn: 1 });
                break;
            case 'yearly':
                startDate = startOfYear(now);
                endDate = endOfYear(now);
                break;
            case 'monthly':
            default:
                startDate = startOfMonth(now);
                endDate = endOfMonth(now);
                break;
        }

        const relevantTransactions = transactions.filter(t => {
             // Use budgetId if available for explicit linking
            if (t.budgetId) {
                return t.budgetId === budget.id;
            }
            
            // Fallback to category/date matching for older transactions
            if (t.amount >= 0 || t.isTransfer) return false;
            
            const txDate = new Date(t.date);
            if(txDate < startDate || txDate > endDate) return false;
            
            if (budget.categories.length > 0) {
                 return budget.categories.some(bc => bc.categoryId === t.categoryId);
            }
            
            return true;
        }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const spent = relevantTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

        return { linkedTransactions: relevantTransactions, totalSpent: spent };

    }, [budget, transactions]);

    const handleExport = (format: 'pdf' | 'xlsx') => {
        if (linkedTransactions.length === 0) return;

        const dataToExport = linkedTransactions.map(t => ({
            Date: new Date(t.date).toLocaleDateString(),
            Description: t.description,
            Category: categories.find(c => c.id === t.categoryId)?.name || 'N/A',
            Account: accounts.find(a => a.id === t.accountId)?.name || 'N/A',
            Amount: t.amount,
        }));
        
        const filename = `${budget.name.replace(/\s/g, '_')}_Report`;

        if (format === 'pdf') {
            const doc = new jsPDF();
            doc.text(`Budget Report: ${budget.name}`, 14, 16);
            doc.text(`Total Spent: ${formatCurrency(totalSpent)} / ${formatCurrency(budget.amount)}`, 14, 22);
            autoTable(doc, {
                head: [['Date', 'Description', 'Category', 'Account', 'Amount']],
                body: dataToExport.map(row => [row.Date, row.Description, row.Category, row.Account, formatCurrency(row.Amount)]),
                startY: 30,
            });
            doc.save(`${filename}.pdf`);
        } else {
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
            XLSX.writeFile(workbook, `${filename}.xlsx`);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">{budget.name}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{budget.period} Budget Details</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><icons.X size={24} /></button>
                </div>
                
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 flex justify-around text-center">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Budgeted</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{formatCurrency(budget.amount)}</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Spent</p>
                        <p className="text-2xl font-bold text-red-500">{formatCurrency(totalSpent)}</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Remaining</p>
                        <p className={`text-2xl font-bold ${budget.amount - totalSpent >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {formatCurrency(budget.amount - totalSpent)}
                        </p>
                    </div>
                </div>

                <div className="flex-grow p-6 overflow-y-auto">
                    <h3 className="font-semibold mb-2">Linked Transactions ({linkedTransactions.length})</h3>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                         <table className="w-full text-sm">
                            <thead className="bg-gray-100 dark:bg-gray-700/50">
                                <tr>
                                    <th className="p-2 text-left font-semibold">Date</th>
                                    <th className="p-2 text-left font-semibold">Description</th>
                                    <th className="p-2 text-left font-semibold">Category</th>
                                    <th className="p-2 text-right font-semibold">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {linkedTransactions.map(t => {
                                    const category = categories.find(c => c.id === t.categoryId);
                                    return (
                                        <tr key={t.id}>
                                            <td className="p-2">{new Date(t.date).toLocaleDateString()}</td>
                                            <td className="p-2 font-medium">{t.description}</td>
                                            <td className="p-2">
                                                <span>{category?.name || 'N/A'}</span>
                                            </td>
                                            <td className="p-2 text-right font-semibold text-red-500">{formatCurrency(t.amount)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {linkedTransactions.length === 0 && <div className="text-center p-8 text-gray-500">No transactions linked to this budget yet.</div>}
                    </div>
                </div>

                 <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                    <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-600">
                        <icons.FileDown size={16}/> Export PDF
                    </button>
                    <button onClick={() => handleExport('xlsx')} className="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-600">
                        <icons.FileDown size={16}/> Export Excel
                    </button>
                    <button type="button" onClick={onClose} className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700">Done</button>
                </div>
            </div>
        </div>
    );
};

export default BudgetDetailModal;