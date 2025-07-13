
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { useCurrency } from '../hooks/useCurrency';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import {
    endOfMonth,
    format,
    endOfYear,
    subMonths,
    startOfMonth,
    startOfYear
} from 'date-fns';
import { SlidersHorizontal, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Landmark, PiggyBank, CreditCard, Banknote, HandCoins, Target, DollarSign, AlertCircle, ArrowRight, Tag } from 'lucide-react';
import * as icons from 'lucide-react';
import WidgetCard from './WidgetCard';
import DashboardCustomizationPanel from './DashboardCustomizationPanel';
import SpendingClassificationChart from './SpendingClassificationChart';
import HelpTooltip from './HelpTooltip';
import type { Category } from '../types';

const CHART_COLORS = ['#3b82f6', '#16a34a', '#ef4444', '#f97316', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

const DynamicIcon = ({ name, ...props }: { name: string; [key: string]: any }) => {
    const LucideIcon = (icons as any)[name] || icons.Tag;
    return <LucideIcon {...props} />;
};

const CustomTooltip = ({ active, payload, label, formatCurrency }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg text-sm">
                <p className="font-bold text-gray-800 dark:text-gray-100 mb-1">{label}</p>
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

const CustomLegend = ({ payload, categoryMap, formatCurrency }: {payload: any[], categoryMap: Map<string, Category>, formatCurrency: (v:number)=>string}) => {
    return (
        <div className="text-xs space-y-1 overflow-y-auto max-h-[150px] pr-2">
            {payload?.map((entry: any, index: number) => {
                const categoryName = entry.value;
                const category = Array.from(categoryMap.values()).find(c => c.name === categoryName);

                return (
                    <div key={`item-${index}`} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 truncate">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }}></div>
                            <span className="truncate text-gray-600 dark:text-gray-300" title={categoryName}>{categoryName}</span>
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(entry.payload.value)}</span>
                    </div>
                );
            })}
        </div>
    );
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
        <p className="text-sm">{message}</p>
    </div>
);

const PersonalBalanceSheet: React.FC<{ onDrillDown: (type: string, title: string) => void }> = ({ onDrillDown }) => {
    const { activeDashboardData } = useAppContext();
    const { formatCurrency } = useCurrency();
    const { transactions, accounts, categories, budgets, widgetSettings } = activeDashboardData;

    const [isCustomizePanelOpen, setCustomizePanelOpen] = useState(false);
    const [dateRangeFilter, setDateRangeFilter] = useState('thisMonth');
    const [customDateRange, setCustomDateRange] = useState({
        start: startOfMonth(new Date()).toISOString().split('T')[0],
        end: endOfMonth(new Date()).toISOString().split('T')[0],
    });
    const [accountTypeFilter, setAccountTypeFilter] = useState<string[]>([]);
    
    const { startDate, endDate } = useMemo(() => {
        const now = new Date();
        switch(dateRangeFilter) {
            case 'last3Months': return { startDate: startOfMonth(subMonths(now, 2)), endDate: endOfMonth(now) };
            case 'thisYear': return { startDate: startOfYear(now), endDate: endOfYear(now) };
            case 'allTime': return { startDate: new Date(0), endDate: now };
            case 'custom': {
                const start = customDateRange.start ? new Date(customDateRange.start) : new Date(0);
                const end = customDateRange.end ? new Date(new Date(customDateRange.end).setHours(23, 59, 59, 999)) : now;
                return { startDate: start, endDate: end };
            }
            case 'thisMonth':
            default: return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
        }
    }, [dateRangeFilter, customDateRange]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const txDate = new Date(t.date);
            const inDate = txDate >= startDate && txDate <= endDate;
            const account = accounts.find(a => a.id === t.accountId);
            const inAccountType = accountTypeFilter.length === 0 || (account && accountTypeFilter.includes(account.type));
            return inDate && inAccountType;
        });
    }, [transactions, startDate, endDate, accountTypeFilter, accounts]);

    const financialSummary = useMemo(() => {
        let assets = 0, liabilities = 0, income = 0, expenses = 0;
        
        accounts.forEach(acc => {
             // Calculate balance up to the end of the filtered date range for an accurate snapshot
            const balance = transactions
                .filter(t => new Date(t.date) <= endDate && t.accountId === acc.id)
                .reduce((sum, t) => sum + t.amount, 0);
            
            if (['Bank', 'Investment', 'Cash'].includes(acc.type)) {
                assets += balance;
            } else if (['Credit Card', 'Loan'].includes(acc.type)) {
                liabilities += balance;
            }
        });

        filteredTransactions.forEach(t => {
            if (t.isTransfer) return;
            if (t.amount > 0) income += t.amount;
            else expenses += Math.abs(t.amount);
        });

        return { assets, liabilities: Math.abs(liabilities), netWorth: assets + liabilities, income, expenses };
    }, [accounts, transactions, filteredTransactions, endDate]);

    const netWorthTrendData = useMemo(() => {
        const data: { name: string; netWorth: number }[] = [];
        if (transactions.length === 0) return data;

        const monthCount = 12;
        const allTxnsByDate = [...transactions].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let currentNetWorth = 0;
        let txnIndex = 0;
        
        // Calculate initial net worth up to the start of the 12-month window
        const windowStartDate = startOfMonth(subMonths(new Date(), monthCount - 1));
        while(txnIndex < allTxnsByDate.length && new Date(allTxnsByDate[txnIndex].date) < windowStartDate) {
            currentNetWorth += allTxnsByDate[txnIndex].amount;
            txnIndex++;
        }

        for (let i = monthCount - 1; i >= 0; i--) {
            const d = subMonths(new Date(), i);
            const endOfMonthDate = endOfMonth(d);

            // Accumulate transactions for the current month
            while(txnIndex < allTxnsByDate.length && new Date(allTxnsByDate[txnIndex].date) <= endOfMonthDate) {
                currentNetWorth += allTxnsByDate[txnIndex].amount;
                txnIndex++;
            }
            
            data.push({ name: format(d, 'MMM yy'), netWorth: currentNetWorth });
        }
        return data;
    }, [transactions]);
    
    const categoryMap = useMemo(() => new Map<string, Category>(categories.map(c => [c.id, c])), [categories]);
    
    const categoryBreakdown = useMemo(() => {
        const spending: { [key: string]: number } = {};
        const income: { [key: string]: number } = {};
        filteredTransactions.forEach(t => {
            if (t.isTransfer || !t.categoryId) return;
            const catName = categoryMap.get(t.categoryId)?.name || 'Uncategorized';
            if (t.amount < 0) spending[catName] = (spending[catName] || 0) + Math.abs(t.amount);
            else income[catName] = (income[catName] || 0) + t.amount;
        });
        const spendingData = Object.entries(spending).map(([name, value], i) => ({ name, value, fill: CHART_COLORS[i % CHART_COLORS.length] }));
        const incomeData = Object.entries(income).map(([name, value], i) => ({ name, value, fill: CHART_COLORS[i % CHART_COLORS.length] }));
        return { spendingData, incomeData };
    }, [filteredTransactions, categoryMap]);

    const budgetSummaryData = useMemo(() => {
        return budgets.map(budget => {
            const spent = filteredTransactions
                .filter(t => {
                    if (t.amount >= 0 || t.isTransfer) return false;
                    if (budget.categories.length === 0) return true;
                    return budget.categories.some(bc => bc.categoryId === t.categoryId);
                })
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
                
            return { name: budget.name, budgeted: budget.amount, spent, remaining: budget.amount - spent };
        });
    }, [budgets, filteredTransactions]);
    
    const accountSummaryData = useMemo(() => {
        return accounts.map(acc => {
            const balance = transactions
                .filter(t => new Date(t.date) <= endDate && t.accountId === acc.id)
                .reduce((sum, t) => sum + t.amount, 0);
            return { ...acc, balance };
        });
    }, [accounts, transactions, endDate]);

    const tagSpendingData = useMemo(() => {
        const spendingByTag = new Map<string, number>();
        filteredTransactions.forEach(t => {
            if (t.amount < 0 && t.tags) {
                t.tags.forEach(tag => {
                    spendingByTag.set(tag, (spendingByTag.get(tag) || 0) + Math.abs(t.amount));
                });
            }
        });
        return Array.from(spendingByTag.entries()).map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value).slice(0, 10);
    }, [filteredTransactions]);

    const AccountIcon = (type: string) => {
        switch(type) {
            case 'Bank': return <Landmark size={16}/>;
            case 'Credit Card': return <CreditCard size={16}/>;
            case 'Loan': return <Banknote size={16}/>;
            case 'Investment': return <PiggyBank size={16}/>;
            case 'Cash': return <HandCoins size={16}/>;
            default: return <DollarSign size={16}/>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    Personal Balance Sheet
                    <HelpTooltip text="Your financial dashboard. Get a high-level overview of your net worth, cash flow, and spending patterns through various charts and summaries." />
                </h3>
                <div className="flex flex-wrap gap-2">
                    <select value={dateRangeFilter} onChange={e => setDateRangeFilter(e.target.value)} className="form-select text-sm bg-white dark:bg-gray-700">
                        <option value="thisMonth">This Month</option>
                        <option value="last3Months">Last 3 Months</option>
                        <option value="thisYear">This Year</option>
                        <option value="allTime">All Time</option>
                        <option value="custom">Custom Range</option>
                    </select>
                    {dateRangeFilter === 'custom' && (
                        <div className="flex items-center gap-2">
                             <input type="date" value={customDateRange.start} onChange={e => setCustomDateRange(p => ({...p, start: e.target.value}))} className="form-input text-sm py-1.5 px-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md"/>
                             <span className="text-gray-500">-</span>
                             <input type="date" value={customDateRange.end} onChange={e => setCustomDateRange(p => ({...p, end: e.target.value}))} className="form-input text-sm py-1.5 px-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md"/>
                        </div>
                    )}
                    <button onClick={() => setCustomizePanelOpen(true)} className="flex items-center gap-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded-lg font-semibold text-sm">
                        <SlidersHorizontal size={16} /> Customize
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {widgetSettings.netWorth && (
                     <WidgetCard title="Net Worth" className="lg:col-span-2">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Assets</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(financialSummary.assets)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Liabilities</p>
                                <p className="text-2xl font-bold text-red-600">{formatCurrency(financialSummary.liabilities)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Net Worth</p>
                                <p className={`text-2xl font-bold ${financialSummary.netWorth >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(financialSummary.netWorth)}</p>
                            </div>
                        </div>
                    </WidgetCard>
                )}
                {widgetSettings.incomeVsExpense && (
                    <WidgetCard title="Cashflow" className="lg:col-span-2">
                         <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Income</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(financialSummary.income)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Expenses</p>
                                <p className="text-2xl font-bold text-red-600">{formatCurrency(financialSummary.expenses)}</p>
                            </div>
                             <div>
                                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Net</p>
                                <p className={`text-2xl font-bold ${financialSummary.income - financialSummary.expenses >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(financialSummary.income - financialSummary.expenses)}</p>
                            </div>
                        </div>
                    </WidgetCard>
                )}
                {widgetSettings.netWorthTrend && (
                    <WidgetCard title="Net Worth Trend" className="md:col-span-2 lg:col-span-4">
                        <ResponsiveContainer width="100%" height={250}>
                             <LineChart data={netWorthTrendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(v).replace(/\.00$/, '')} />
                                <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                                <Line type="monotone" dataKey="netWorth" stroke="#3b82f6" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </WidgetCard>
                )}
                 {widgetSettings.spendingBreakdown && (
                    <WidgetCard title="Spending Breakdown" className="md:col-span-1 lg:col-span-2">
                         <ResponsiveContainer width="100%" height={200}>
                            {categoryBreakdown.spendingData.length > 0 ? (
                                <PieChart>
                                    <Pie data={categoryBreakdown.spendingData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} labelLine={false} >
                                        {categoryBreakdown.spendingData.map((entry) => <Cell key={`cell-${entry.name}`} fill={entry.fill} />)}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                                    <Legend layout="vertical" align="right" verticalAlign="middle" width={140} content={<CustomLegend payload={undefined} categoryMap={categoryMap} formatCurrency={formatCurrency} />} />
                                </PieChart>
                            ) : <EmptyState message="No spending data for this period."/>}
                        </ResponsiveContainer>
                    </WidgetCard>
                 )}
                {widgetSettings.spendingClassification && (
                    <WidgetCard title="Spending by Classification" className="md:col-span-1 lg:col-span-2">
                        <SpendingClassificationChart transactions={filteredTransactions} />
                    </WidgetCard>
                 )}
                 {widgetSettings.incomeBreakdown && (
                    <WidgetCard title="Income Breakdown" className="md:col-span-1 lg:col-span-2">
                         <ResponsiveContainer width="100%" height={200}>
                            {categoryBreakdown.incomeData.length > 0 ? (
                                <PieChart>
                                    <Pie data={categoryBreakdown.incomeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} labelLine={false}>
                                        {categoryBreakdown.incomeData.map((entry) => <Cell key={`cell-${entry.name}`} fill={entry.fill} />)}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                                    <Legend layout="vertical" align="right" verticalAlign="middle" width={140} content={<CustomLegend payload={undefined} categoryMap={categoryMap} formatCurrency={formatCurrency} />} />
                                </PieChart>
                            ) : <EmptyState message="No income data for this period."/>}
                        </ResponsiveContainer>
                    </WidgetCard>
                 )}
                 {widgetSettings.tagSpending && (
                     <WidgetCard title="Tag-wise Spending" className="md:col-span-2 lg:col-span-2">
                        <ResponsiveContainer width="100%" height={200}>
                            {tagSpendingData.length > 0 ? (
                                <BarChart data={tagSpendingData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                    <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                                    <Bar dataKey="value" fill="#8884d8" barSize={15}>
                                        {tagSpendingData.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            ) : <EmptyState message="No spending with tags in this period."/>}
                        </ResponsiveContainer>
                     </WidgetCard>
                 )}
                 {widgetSettings.budgetSummary && (
                    <WidgetCard title="Budget Summary" className="md:col-span-2 lg:col-span-2">
                        <div className="space-y-3">
                            {budgetSummaryData.length > 0 ? budgetSummaryData.map(b => (
                                <div key={b.name}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-semibold text-gray-700 dark:text-gray-300">{b.name}</span>
                                        <span className={`font-medium ${b.remaining < 0 ? 'text-red-500' : 'text-gray-600'}`}>{formatCurrency(b.spent)} / {formatCurrency(b.budgeted)}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div className={b.remaining < 0 ? 'bg-red-500' : 'bg-primary-500'} style={{ width: `${Math.min((b.spent/b.budgeted) * 100, 100)}%`}}></div>
                                    </div>
                                </div>
                            )) : <EmptyState message="No budgets set up." />}
                        </div>
                    </WidgetCard>
                 )}
                  {widgetSettings.accountSummary && (
                    <WidgetCard title="Account Balances" className="md:col-span-2 lg:col-span-2">
                        <div className="space-y-2 max-h-52 overflow-y-auto pr-2">
                            {accountSummaryData.length > 0 ? accountSummaryData.map(acc => (
                                <div key={acc.id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50">
                                    <div className="flex items-center gap-2">
                                        {AccountIcon(acc.type)}
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{acc.name}</span>
                                    </div>
                                    <span className={`font-semibold ${acc.balance >= 0 ? 'text-gray-800 dark:text-gray-200' : 'text-red-500'}`}>
                                        {formatCurrency(acc.balance)}
                                    </span>
                                </div>
                            )) : <EmptyState message="No accounts found." />}
                        </div>
                    </WidgetCard>
                 )}
            </div>
            
            {isCustomizePanelOpen && <DashboardCustomizationPanel onClose={() => setCustomizePanelOpen(false)} />}
        </div>
    );
};

export default PersonalBalanceSheet;