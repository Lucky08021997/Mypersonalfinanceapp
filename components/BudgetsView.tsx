
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { useCurrency } from '../hooks/useCurrency';
import type { Budget } from '../types';
import { Plus, Target, Edit, Trash2, AlertCircle } from 'lucide-react';
import AddBudgetModal from './AddBudgetModal';
import BudgetDetailModal from './BudgetDetailModal';
import {
    endOfMonth,
    endOfWeek,
    endOfYear,
    startOfMonth,
    startOfWeek,
    startOfYear,
} from 'date-fns';
import HelpTooltip from './HelpTooltip';

const BudgetCard: React.FC<{ budget: Budget; onCardClick: () => void; onEdit: () => void; onDelete: () => void }> = ({ budget, onCardClick, onEdit, onDelete }) => {
    const { activeDashboardData } = useAppContext();
    const { formatCurrency } = useCurrency();
    const { transactions, categories } = activeDashboardData;

    const { spent, progress, overspent } = useMemo(() => {
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
            if (t.amount >= 0 || t.isTransfer) return false;

            const txDate = new Date(t.date);
            if(txDate < startDate || txDate > endDate) return false;
            
            // If budget has specific categories, only include txns from those cats
            if (budget.categories.length > 0) {
                 return budget.categories.some(bc => bc.categoryId === t.categoryId);
            }
            
            // If budget has no cats, it's a general budget, so include all expenses
            return true;
        });

        const totalSpent = relevantTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

        return {
            spent: totalSpent,
            progress: budget.amount > 0 ? (totalSpent / budget.amount) * 100 : 0,
            overspent: totalSpent > budget.amount,
        };
    }, [budget, transactions]);

    const progressColor = overspent ? 'bg-red-500' : 'bg-primary-600';

    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    }

    return (
        <div onClick={onCardClick} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3 relative group cursor-pointer transition-transform hover:-translate-y-1">
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => handleActionClick(e, onEdit)} className="p-1.5 rounded-md bg-white/50 dark:bg-gray-700/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600"><Edit size={14}/></button>
                <button onClick={(e) => handleActionClick(e, onDelete)} className="p-1.5 rounded-md bg-white/50 dark:bg-gray-700/50 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600"><Trash2 size={14}/></button>
            </div>
            <div>
                <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100">{budget.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{budget.period} Budget ({budget.categories.length > 0 ? `${budget.categories.length} categories` : 'All Spending'})</p>
            </div>
            
            <div>
                <div className="flex justify-between items-baseline mb-1">
                    <span className="font-semibold text-lg text-primary-600 dark:text-primary-400">{formatCurrency(spent)}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">of {formatCurrency(budget.amount)}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className={progressColor} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                </div>
                {overspent && (
                    <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                        <AlertCircle size={14}/>
                        Overspent by {formatCurrency(spent - budget.amount)}
                    </div>
                )}
            </div>
        </div>
    );
}

const BudgetsView: React.FC = () => {
    const { activeDashboardData, deleteBudget } = useAppContext();
    const { budgets } = activeDashboardData;
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
    const [viewingBudget, setViewingBudget] = useState<Budget | null>(null);

    const handleEdit = (budget: Budget) => {
        setEditingBudget(budget);
        setAddModalOpen(true);
    };

    const handleAdd = () => {
        setEditingBudget(null);
        setAddModalOpen(true);
    };

    const handleDelete = (budgetId: string) => {
        if(window.confirm('Are you sure you want to delete this budget?')) {
            deleteBudget(budgetId);
        }
    };
    
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    Budgets
                    <HelpTooltip text="Set spending limits for different categories on a weekly, monthly, or yearly basis to keep your spending in check." />
                </h3>
                <button onClick={handleAdd} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow">
                    <Plus size={18} /> Create Budget
                </button>
            </div>
            
            {budgets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {budgets.map(b => (
                        <BudgetCard 
                            key={b.id} 
                            budget={b}
                            onCardClick={() => setViewingBudget(b)}
                            onEdit={() => handleEdit(b)} 
                            onDelete={() => handleDelete(b.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <Target className="mx-auto h-12 w-12 text-gray-400" />
                    <h4 className="mt-2 text-lg font-semibold text-gray-800 dark:text-gray-100">No Budgets Created</h4>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Click 'Create Budget' to start tracking your spending.</p>
                </div>
            )}

            {isAddModalOpen && <AddBudgetModal budget={editingBudget} onClose={() => setAddModalOpen(false)} />}
            {viewingBudget && <BudgetDetailModal budget={viewingBudget} onClose={() => setViewingBudget(null)} />}
        </div>
    );
};

export default BudgetsView;