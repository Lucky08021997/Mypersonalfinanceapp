import React from 'react';
import { Scale, Wallet } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';

interface FinancialHighlightsProps {
    netWorth: number;
    cashflow: number;
}

const FinancialHighlights: React.FC<FinancialHighlightsProps> = ({ netWorth, cashflow }) => {
    const { formatCurrency } = useCurrency();
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg flex items-center gap-6">
                <div className="p-4 bg-blue-100 dark:bg-blue-900/40 rounded-full">
                    <Scale className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-400">Net Worth</p>
                    <p className={`text-3xl font-bold ${netWorth >= 0 ? 'text-gray-800 dark:text-gray-100' : 'text-red-500'}`}>
                        {formatCurrency(netWorth)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-500">(Assets - Liabilities)</p>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg flex items-center gap-6">
                <div className="p-4 bg-purple-100 dark:bg-purple-900/40 rounded-full">
                    <Wallet className="h-8 w-8 text-purple-500" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-400">Monthly Cashflow</p>
                    <p className={`text-3xl font-bold ${cashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(cashflow)}
                    </p>
                     <p className="text-xs text-gray-600 dark:text-gray-500">(Income - Expenses)</p>
                </div>
            </div>
        </div>
    );
};

export default FinancialHighlights;