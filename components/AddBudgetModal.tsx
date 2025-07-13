
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import type { Budget, BudgetCategory } from '../types';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';

interface AddBudgetModalProps {
    onClose: () => void;
    budget?: Budget | null;
}

const AddBudgetModal: React.FC<AddBudgetModalProps> = ({ onClose, budget }) => {
    const { activeDashboardData, addBudget, updateBudget } = useAppContext();
    const { formatCurrency } = useCurrency();
    const { categories } = activeDashboardData;

    const [name, setName] = useState(budget?.name || '');
    const [amount, setAmount] = useState(budget?.amount || 0);
    const [period, setPeriod] = useState<'monthly' | 'yearly' | 'weekly'>(budget?.period || 'monthly');
    const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>(budget?.categories || []);
    
    const unallocatedAmount = useMemo(() => {
        const allocated = budgetCategories.reduce((sum, bc) => sum + bc.amount, 0);
        return amount - allocated;
    }, [amount, budgetCategories]);
    
    const availableCategories = useMemo(() => {
        const usedCategoryIds = new Set(budgetCategories.map(bc => bc.categoryId));
        return categories.filter(c => !usedCategoryIds.has(c.id));
    }, [categories, budgetCategories]);

    const handleCategoryChange = (index: number, field: keyof BudgetCategory, value: string) => {
        const newBudgetCategories = [...budgetCategories];
        if (field === 'amount') {
            newBudgetCategories[index][field] = parseFloat(value) || 0;
        } else {
            newBudgetCategories[index][field] = value;
        }
        setBudgetCategories(newBudgetCategories);
    };

    const addCategoryToBudget = () => {
        if (availableCategories.length > 0) {
            setBudgetCategories([...budgetCategories, { categoryId: availableCategories[0].id, amount: 0 }]);
        }
    };
    
    const removeCategoryFromBudget = (index: number) => {
        setBudgetCategories(budgetCategories.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!name.trim() || amount <= 0) {
            alert("Please provide a name and a valid amount for the budget.");
            return;
        }
        if (unallocatedAmount < 0) {
            alert("Total of category budgets cannot exceed the total budget amount.");
            return;
        }

        const budgetData = { name, amount, period, categories: budgetCategories };
        if (budget) {
            updateBudget({ ...budgetData, id: budget.id });
        } else {
            addBudget(budgetData);
        }
        onClose();
    };
    
    const inputClasses = "mt-1 block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold">{budget ? 'Edit' : 'Create'} Budget</h2>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X size={24} /></button>
                </div>

                <div className="p-6 space-y-4 flex-grow overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium">Budget Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClasses} required/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Total Amount</label>
                            <input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)} className={inputClasses} min="0" step="0.01" required/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Period</label>
                            <select value={period} onChange={e => setPeriod(e.target.value as any)} className={inputClasses}>
                                <option value="monthly">Monthly</option>
                                <option value="weekly">Weekly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-lg">Category Budgets (Optional)</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Unallocated: <span className={`font-bold ${unallocatedAmount < 0 ? 'text-red-500' : 'text-green-500'}`}>{formatCurrency(unallocatedAmount)}</span></p>

                        <div className="space-y-2">
                            {budgetCategories.map((bc, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <select value={bc.categoryId} onChange={e => handleCategoryChange(index, 'categoryId', e.target.value)} className={`w-1/2 ${inputClasses}`}>
                                        <option value={bc.categoryId}>{categories.find(c=>c.id === bc.categoryId)?.name}</option>
                                        {availableCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <input type="number" value={bc.amount} onChange={e => handleCategoryChange(index, 'amount', e.target.value)} className={`w-1/2 ${inputClasses}`} placeholder="Amount" />
                                    <button type="button" onClick={() => removeCategoryFromBudget(index)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-md"><Trash2 size={16}/></button>
                                </div>
                            ))}
                        </div>

                         <button type="button" onClick={addCategoryToBudget} disabled={availableCategories.length === 0} className="mt-2 flex items-center gap-2 text-sm text-primary-600 font-semibold hover:underline disabled:text-gray-400 disabled:cursor-not-allowed">
                            <Plus size={16}/> Add Category
                        </button>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                    <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center gap-2">
                        <Save size={18}/> {budget ? 'Save Changes' : 'Create Budget'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddBudgetModal;