import React, { useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { useCurrency } from '../hooks/useCurrency';
import WidgetCard from './WidgetCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Bar, BarChart, XAxis, YAxis } from 'recharts';
import { CreditCard, AlertTriangle } from 'lucide-react';

const CHART_COLORS = ['#3b82f6', '#16a34a', '#ef4444', '#f97316', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

const CustomTooltip = ({ active, payload, formatCurrency }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg text-sm">
            {payload.map((p: any, i: number) => (
                <p key={i} style={{ color: p.color || p.payload.fill }} className="font-medium">
                    {`${p.name}: ${formatCurrency(p.value)}`}
                </p>
            ))}
        </div>
      );
    }
    return null;
};

const CreditCardAnalysisView: React.FC = () => {
    const { activeDashboardData } = useAppContext();
    const { formatCurrency } = useCurrency();
    const { accounts, transactions, categories } = activeDashboardData;

    const creditCards = useMemo(() => accounts.filter(acc => acc.type === 'Credit Card'), [accounts]);
    
    const cardData = useMemo(() => {
        return creditCards.map(card => {
            const cardTransactions = transactions.filter(t => t.accountId === card.id);
            const balance = cardTransactions.reduce((sum, t) => sum + t.amount, 0);
            const utilization = card.creditLimit ? (Math.abs(balance) / card.creditLimit) * 100 : 0;
            const spending = cardTransactions.filter(t => t.amount < 0 && !t.isTransfer).reduce((sum, t) => sum + Math.abs(t.amount), 0);
            
            const spendingByCategory = cardTransactions
                .filter(t => t.amount < 0 && !t.isTransfer && t.categoryId)
                .reduce((acc, t) => {
                    const catName = categories.find(c => c.id === t.categoryId)?.name || 'Uncategorized';
                    acc[catName] = (acc[catName] || 0) + Math.abs(t.amount);
                    return acc;
                }, {} as Record<string, number>);

            const spendingByClassification = cardTransactions
                .filter(t => t.amount < 0 && !t.isTransfer && t.classification)
                .reduce((acc, t) => {
                    acc[t.classification!] = (acc[t.classification!] || 0) + Math.abs(t.amount);
                    return acc;
                }, {} as Record<string, number>);

            return {
                ...card,
                balance: Math.abs(balance),
                utilization,
                spending,
                spendingByCategory,
                spendingByClassification,
            };
        });
    }, [creditCards, transactions, categories]);

    const totalSpending = useMemo(() => cardData.reduce((sum, card) => sum + card.spending, 0), [cardData]);
    
    return (
        <div className="space-y-6">
            <WidgetCard title="Total Credit Card Spending">
                <p className="text-4xl font-extrabold text-red-500 text-center">{formatCurrency(totalSpending)}</p>
            </WidgetCard>
            
            <WidgetCard title="Credit Utilization">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cardData.map(card => (
                        <div key={card.id} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                            <h4 className="font-bold text-gray-800 dark:text-gray-100">{card.name}</h4>
                             <div className="flex justify-between items-baseline text-sm mt-1">
                                <span className="font-medium text-gray-600 dark:text-gray-400">Used: {formatCurrency(card.balance)}</span>
                                <span className="font-medium text-gray-600 dark:text-gray-400">Limit: {formatCurrency(card.creditLimit || 0)}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mt-1 relative">
                                <div className={`h-4 rounded-full ${card.utilization > 40 ? 'bg-red-500' : 'bg-primary-500'}`} style={{ width: `${Math.min(card.utilization, 100)}%` }}></div>
                                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-difference">{card.utilization.toFixed(1)}%</span>
                            </div>
                            {card.utilization > 40 && (
                                <p className="text-xs text-red-500 flex items-center gap-1 mt-1"><AlertTriangle size={14} /> High utilization may impact credit score.</p>
                            )}
                        </div>
                    ))}
                </div>
            </WidgetCard>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <WidgetCard title="Spending by Category">
                    <ResponsiveContainer width="100%" height={300}>
                         <PieChart>
                             <Pie data={
                                 Object.entries(cardData.reduce((acc, card) => {
                                     Object.entries(card.spendingByCategory).forEach(([cat, amount]) => {
                                         acc[cat] = (acc[cat] || 0) + amount;
                                     });
                                     return acc;
                                 }, {} as Record<string, number>))
                                 .map(([name, value], i) => ({ name, value, fill: CHART_COLORS[i % CHART_COLORS.length] }))
                             } dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                {CHART_COLORS.map((color, index) => <Cell key={`cell-${index}`} fill={color} />)}
                             </Pie>
                             <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                             <Legend />
                         </PieChart>
                     </ResponsiveContainer>
                 </WidgetCard>
                 <WidgetCard title="Spending by Classification (Want/Need/Must)">
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={
                            Object.entries(cardData.reduce((acc, card) => {
                                 Object.entries(card.spendingByClassification).forEach(([classification, amount]) => {
                                     acc[classification] = (acc[classification] || 0) + amount;
                                 });
                                 return acc;
                             }, {} as Record<string, number>))
                             .map(([name, value], i) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, fill: CHART_COLORS[i % CHART_COLORS.length] }))
                        }>
                             <XAxis dataKey="name" />
                             <YAxis tickFormatter={(value) => formatCurrency(value).replace(/\.00$/, '')} />
                             <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                             <Bar dataKey="value" />
                         </BarChart>
                     </ResponsiveContainer>
                 </WidgetCard>
            </div>
        </div>
    );
};

export default CreditCardAnalysisView;
