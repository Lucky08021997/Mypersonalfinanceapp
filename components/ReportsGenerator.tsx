

import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { useCurrency } from '../hooks/useCurrency';
import { FileDown, FileText, Eye, AreaChart, BarChart, ListChecks } from 'lucide-react';
import { exportToPdf, exportToXlsx } from '../lib/reporting';
import { endOfMonth, subMonths, startOfMonth } from 'date-fns';
import ReportViewerModal from './ReportViewerModal';
import DetailedReportView from './DetailedReportView';

const reportTypes = [
    { id: 'Monthly Summary', name: 'Monthly Summary', icon: AreaChart },
    { id: 'Income vs. Expense', name: 'Income vs. Expense', icon: BarChart },
    { id: 'Category Spending', name: 'Category Spending', icon: FileText },
    { id: 'Detailed Report', name: 'Detailed Report', icon: ListChecks },
];

const ReportsGenerator: React.FC = () => {
    const { activeDashboardData, state, addNotification } = useAppContext();
    const { formatCurrency } = useCurrency();
    const [reportType, setReportType] = useState(reportTypes[0].id);
    const [dateRange, setDateRange] = useState({
        start: startOfMonth(new Date()).toISOString().split('T')[0],
        end: endOfMonth(new Date()).toISOString().split('T')[0],
    });
    const [isViewerOpen, setViewerOpen] = useState(false);
    const [reportPreviewData, setReportPreviewData] = useState<any>(null);
    const [generatedSummary, setGeneratedSummary] = useState<{ count: number; income: number; expenses: number; } | null>(null);

    const handleDateRangePreset = (preset: 'thisMonth' | 'lastMonth') => {
        const now = new Date();
        let start, end;
        if (preset === 'thisMonth') {
            start = startOfMonth(now);
            end = endOfMonth(now);
        } else {
            const lastMonth = subMonths(now, 1);
            start = startOfMonth(lastMonth);
            end = endOfMonth(lastMonth);
        }
        setDateRange({
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0],
        });
        setGeneratedSummary(null);
    };

    const handleDateChange = (field: 'start' | 'end', value: string) => {
        setDateRange(prev => ({ ...prev, [field]: value }));
        setGeneratedSummary(null);
    }
    
    const generateReportData = (forSummary: boolean = false) => {
        const { transactions, accounts, categories } = activeDashboardData;
        const filteredTransactions = transactions.filter(t => {
            const txDate = new Date(t.date);
            const start = new Date(dateRange.start);
            const end = new Date(new Date(dateRange.end).setHours(23,59,59,999));
            return txDate >= start && txDate <= end;
        });

        if (forSummary) {
            const income = filteredTransactions.filter(t => t.amount > 0 && !t.isTransfer).reduce((sum, t) => sum + t.amount, 0);
            const expenses = filteredTransactions.filter(t => t.amount < 0 && !t.isTransfer).reduce((sum, t) => sum + Math.abs(t.amount), 0);
            return { count: filteredTransactions.length, income, expenses };
        }
        
        const categoryMap = new Map(categories.map(c => [c.id, c.name]));
        
        let body: (string|number)[][] = [];
        let head: string[][] = [];

        switch(reportType) {
            case 'Monthly Summary':
            case 'Income vs. Expense': {
                const income = filteredTransactions.filter(t => t.amount > 0 && !t.isTransfer).reduce((sum, t) => sum + t.amount, 0);
                const expenses = filteredTransactions.filter(t => t.amount < 0 && !t.isTransfer).reduce((sum, t) => sum + t.amount, 0);
                const net = income + expenses;
                head = [['Metric', 'Amount']];
                body = [
                    ['Total Income', formatCurrency(income)],
                    ['Total Expenses', formatCurrency(Math.abs(expenses))],
                    ['Net Savings', formatCurrency(net)],
                ];
                break;
            }
            case 'Category Spending': {
                head = [['Category', 'Amount', 'Transactions']];
                const spending: {[key: string]: { amount: number, count: number }} = {};
                filteredTransactions.filter(t => t.amount < 0 && !t.isTransfer).forEach(t => {
                    const catName = t.categoryId ? categoryMap.get(t.categoryId) || 'Uncategorized' : 'Uncategorized';
                    if (!spending[catName]) spending[catName] = { amount: 0, count: 0 };
                    spending[catName].amount += Math.abs(t.amount);
                    spending[catName].count++;
                });
                body = Object.entries(spending)
                    .sort(([,a], [,b]) => b.amount - a.amount)
                    .map(([name, data]) => [name, formatCurrency(data.amount), data.count]);
                break;
            }
        }
        
        return {
            title: reportType,
            dateRange: { start: new Date(dateRange.start), end: new Date(dateRange.end) },
            head,
            body
        };
    };

    const handleGenerateSummary = () => {
        setGeneratedSummary(generateReportData(true) as any);
    }

    const handleViewReport = () => {
        setReportPreviewData(generateReportData());
        setViewerOpen(true);
    };

    const handleExport = (format: 'pdf' | 'xlsx') => {
        const { transactions, accounts, categories } = activeDashboardData;

        const filteredTransactions = transactions.filter(t => {
            const txDate = new Date(t.date);
            const start = new Date(dateRange.start);
            const end = new Date(new Date(dateRange.end).setHours(23,59,59,999));
            return txDate >= start && txDate <= end;
        });

        if (filteredTransactions.length === 0) {
            addNotification("No transactions in the selected date range to export.", "error");
            return;
        }

        const reportData = {
            transactions: filteredTransactions,
            accounts,
            categories,
            currencyCode: state.currency,
        };
        
        const params = {
            reportType,
            dateRange: { start: new Date(dateRange.start), end: new Date(dateRange.end) },
            data: reportData
        };

        if (format === 'pdf') {
            exportToPdf(params);
        } else {
            exportToXlsx(params);
        }
    };

    if (reportType === 'Detailed Report') {
        return <DetailedReportView />;
    }

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Report Generator</h3>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
                <div>
                    <h4 className="font-bold text-lg mb-3">1. Select Report Type</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {reportTypes.map(type => (
                            <button key={type.id} onClick={() => { setReportType(type.id); setGeneratedSummary(null); }}
                                className={`p-4 rounded-lg text-left border-2 transition-all ${reportType === type.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/40 shadow-md' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                <type.icon className="h-6 w-6 mb-2 text-primary-600" />
                                <p className="font-semibold text-gray-800 dark:text-gray-100">{type.name}</p>
                            </button>
                        ))}
                    </div>
                </div>

                 <div>
                    <h4 className="font-bold text-lg mb-3">2. Choose Date Range</h4>
                     <div className="flex flex-wrap items-center gap-4">
                        <input type="date" value={dateRange.start} onChange={e => handleDateChange('start', e.target.value)} className="form-input bg-gray-50 dark:bg-gray-700/50 rounded-lg"/>
                        <span className="font-semibold text-gray-500">to</span>
                        <input type="date" value={dateRange.end} onChange={e => handleDateChange('end', e.target.value)} className="form-input bg-gray-50 dark:bg-gray-700/50 rounded-lg"/>
                         <div className="flex gap-2">
                             <button onClick={() => handleDateRangePreset('thisMonth')} className="px-3 py-1.5 rounded-full text-sm font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 hover:bg-primary-200">This Month</button>
                             <button onClick={() => handleDateRangePreset('lastMonth')} className="px-3 py-1.5 rounded-full text-sm font-semibold bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300">Last Month</button>
                        </div>
                    </div>
                 </div>

                <div>
                    <h4 className="font-bold text-lg mb-3">3. Generate</h4>
                    <button onClick={handleGenerateSummary} className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-md text-base">
                        Generate Report
                    </button>
                </div>

                {generatedSummary && (
                     <div className="bg-gray-50 dark:bg-gray-900/30 p-6 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
                        <h4 className="font-bold text-lg">Report Summary</h4>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                             <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Transactions</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{generatedSummary.count}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Income</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(generatedSummary.income)}</p>
                            </div>
                             <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
                                <p className="text-2xl font-bold text-red-600">{formatCurrency(generatedSummary.expenses)}</p>
                            </div>
                        </div>
                        <div className="flex justify-center flex-wrap gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                             <button onClick={handleViewReport} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow">
                                <Eye size={18} /> View Detailed Report
                            </button>
                            <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-600">
                                <FileDown size={18} /> Export PDF
                            </button>
                            <button onClick={() => handleExport('xlsx')} className="flex items-center gap-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-600">
                                <FileDown size={18} /> Export Excel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isViewerOpen && reportPreviewData && (
                <ReportViewerModal 
                    isOpen={isViewerOpen} 
                    onClose={() => setViewerOpen(false)} 
                    reportData={reportPreviewData}
                    onExport={handleExport}
                />
            )}
        </div>
    );
};

export default ReportsGenerator;