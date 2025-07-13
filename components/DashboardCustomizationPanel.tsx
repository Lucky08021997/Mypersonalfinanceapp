import React from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { useAppContext } from '../hooks/useAppContext';
import { WidgetSettings } from '../types';

interface DashboardCustomizationPanelProps {
    onClose: () => void;
}

const WIDGET_LABELS: Record<string, string> = {
    netWorth: "Net Worth Summary",
    netWorthTrend: "Net Worth Trend",
    incomeVsExpense: "Cashflow Summary",
    spendingBreakdown: "Spending Breakdown",
    spendingClassification: "Spending by Classification",
    incomeBreakdown: "Income Breakdown",
    tagSpending: "Tag-wise Spending",
    budgetSummary: "Budget Summary",
    accountSummary: "Account Balances",
};

const DashboardCustomizationPanel: React.FC<DashboardCustomizationPanelProps> = ({ onClose }) => {
    const { activeDashboardData, setWidgetSettings } = useAppContext();
    const { widgetSettings } = activeDashboardData;

    const handleToggle = (key: string) => {
        const newSettings: WidgetSettings = { ...widgetSettings, [key]: !widgetSettings[key] };
        setWidgetSettings(newSettings);
    };

    return (
        <div className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-gray-800 shadow-xl z-40 p-6 flex flex-col transform transition-transform border-l border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-gray-700">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <SlidersHorizontal size={20} /> Customize
                </h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <X size={20} />
                </button>
            </div>
            <div className="flex-grow overflow-y-auto -mr-6 pr-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select the widgets you want to see on your balance sheet.</p>
                <div className="space-y-3">
                    {Object.entries(WIDGET_LABELS).map(([key, label]) => (
                        <label key={key} htmlFor={key} className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50">
                            <span className="font-medium text-gray-700 dark:text-gray-200">{label}</span>
                            <input
                                id={key}
                                type="checkbox"
                                checked={!!widgetSettings[key]}
                                onChange={() => handleToggle(key)}
                                className="h-5 w-5 rounded-md text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/50 checked:bg-primary-600 focus:ring-offset-white dark:focus:ring-offset-gray-800"
                            />
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DashboardCustomizationPanel;