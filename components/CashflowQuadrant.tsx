import React, { useMemo, useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import FinancialHighlights from './FinancialHighlights';
import QuadrantCard from './QuadrantCard';
import { getFinancialAnalysis } from '../lib/gemini';
import type { FinancialAnalysis, FinancialData } from '../lib/gemini';
import AIInsightsModal from './AIInsightsModal';
import { Sparkles } from 'lucide-react';

const CashflowQuadrant: React.FC<{ onDrillDown: (type: string, title: string) => void }> = ({ onDrillDown }) => {
    const { activeDashboardData } = useAppContext();
    const { accounts, transactions, categories } = activeDashboardData;

    const summary = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const assetsAccounts = accounts.filter(a => ['Bank', 'Investment', 'Cash'].includes(a.type));
        const liabilitiesAccounts = accounts.filter(a => ['Credit Card', 'Loan'].includes(a.type));

        let assets = 0;
        let liabilities = 0;

        accounts.forEach(acc => {
            const balance = transactions
                .filter(t => t.accountId === acc.id)
                .reduce((sum, txn) => sum + txn.amount, 0);
            
            if (assetsAccounts.some(a => a.id === acc.id)) {
                assets += balance;
            } else if (liabilitiesAccounts.some(a => a.id === acc.id)) {
                liabilities += balance;
            }
        });

        let income = 0;
        let expenses = 0;
        const expenseDataMap = new Map<string, { name: string, value: number, fill: string }>();
        const incomeDataMap = new Map<string, { name: string, value: number, fill: string }>();

        const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

        transactions.forEach(txn => {
            if (new Date(txn.date) >= startOfMonth) {
                if (txn.isTransfer) return;
                
                const category = categories.find(c => c.id === txn.categoryId);
                const categoryName = category?.name || 'Uncategorized';
                
                if (txn.amount > 0) {
                    income += txn.amount;
                    const current = incomeDataMap.get(categoryName) || { name: categoryName, value: 0, fill: COLORS[incomeDataMap.size % COLORS.length] };
                    current.value += txn.amount;
                    incomeDataMap.set(categoryName, current);
                } else {
                    expenses += Math.abs(txn.amount);
                    const current = expenseDataMap.get(categoryName) || { name: categoryName, value: 0, fill: COLORS[expenseDataMap.size % COLORS.length] };
                    current.value += Math.abs(txn.amount);
                    expenseDataMap.set(categoryName, current);
                }
            }
        });

        return {
            assets,
            liabilities: Math.abs(liabilities),
            netWorth: assets + liabilities, // liabilities is negative, so this works
            income,
            expenses,
            cashflow: income - expenses,
            assetData: assetsAccounts.map((acc, i) => {
                const balance = transactions.filter(t => t.accountId === acc.id).reduce((sum, txn) => sum + txn.amount, 0);
                return { name: acc.name, value: balance > 0 ? balance : 0, fill: COLORS[i % COLORS.length] };
            }).filter(d => d.value > 0),
            liabilityData: liabilitiesAccounts.map((acc, i) => {
                const balance = transactions.filter(t => t.accountId === acc.id).reduce((sum, txn) => sum + txn.amount, 0);
                return { name: acc.name, value: Math.abs(balance), fill: COLORS[i % COLORS.length] };
            }).filter(d => d.value > 0),
            incomeData: Array.from(incomeDataMap.values()),
            expenseData: Array.from(expenseDataMap.values()),
        };
    }, [accounts, transactions, categories]);
    
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiInsights, setAiInsights] = useState<FinancialAnalysis | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);

    const handleGetAiInsights = async () => {
        setIsAiModalOpen(true);
        setIsAiLoading(true);
        setAiError(null);
        setAiInsights(null);

        const financialData: FinancialData = {
            assets: summary.assets,
            liabilities: summary.liabilities,
            netWorth: summary.netWorth,
            monthlyIncome: summary.income,
            monthlyExpenses: summary.expenses,
            monthlyCashflow: summary.cashflow,
            expenseBreakdown: summary.expenseData.map(d => ({ category: d.name, amount: d.value })),
        };
        
        try {
            const result = await getFinancialAnalysis(financialData);
            setAiInsights(result);
        } catch (e: any) {
            console.error("Gemini API error:", e);
            setAiError(e.message || "Failed to get insights from the AI. Please try again later.");
        } finally {
            setIsAiLoading(false);
        }
    };
    
    return (
        <div className="space-y-8">
            <FinancialHighlights netWorth={summary.netWorth} cashflow={summary.cashflow} />

            <div className="text-center">
                <button
                    onClick={handleGetAiInsights}
                    disabled={isAiLoading}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-indigo-600 text-white px-6 py-3 rounded-full font-semibold hover:from-primary-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-wait"
                >
                    {isAiLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <Sparkles size={20} /> Get AI Financial Insights
                        </>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <QuadrantCard title="Assets" amount={summary.assets} description="(What you own)" color="green" data={summary.assetData} onDrillDown={() => onDrillDown('assets', 'All Assets')} />
                <QuadrantCard title="Liabilities" amount={summary.liabilities} description="(What you owe)" color="red" data={summary.liabilityData} onDrillDown={() => onDrillDown('liabilities', 'All Liabilities')} />
                <QuadrantCard title="Income" amount={summary.income} description="(Money In - MTD)" color="green" data={summary.incomeData} onDrillDown={() => onDrillDown('income', 'Month-to-Date Income')} />
                <QuadrantCard title="Expenses" amount={summary.expenses} description="(Money Out - MTD)" color="red" data={summary.expenseData} onDrillDown={() => onDrillDown('expenses', 'Month-to-Date Expenses')} />
            </div>

            <AIInsightsModal
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                isLoading={isAiLoading}
                insights={aiInsights}
                error={aiError}
            />
        </div>
    );
};

export default CashflowQuadrant;