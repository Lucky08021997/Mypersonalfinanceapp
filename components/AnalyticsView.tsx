import React, { useState } from 'react';
import { CandlestickChart, CreditCard, FileText, Sparkles } from 'lucide-react';
import PersonalBalanceSheet from './PersonalBalanceSheet';
import ReportsGenerator from './ReportsGenerator';
import CreditCardAnalysisView from './CreditCardAnalysisView';

type AnalyticsTab = 'dashboard' | 'creditCards' | 'reports';

const TabButton: React.FC<{
    label: string;
    icon: React.ElementType;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon: Icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm font-semibold ${
            isActive
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50'
        }`}
    >
        <Icon size={20} />
        {label}
    </button>
);

const AnalyticsView: React.FC<{ handleDrillDown: (type: string, title: string) => void; onOpenAiChat: () => void; }> = ({ handleDrillDown, onOpenAiChat }) => {
    const [activeTab, setActiveTab] = useState<AnalyticsTab>('dashboard');

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <PersonalBalanceSheet onDrillDown={handleDrillDown} />;
            case 'creditCards':
                return <CreditCardAnalysisView />;
            case 'reports':
                return <ReportsGenerator />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 flex flex-wrap items-center gap-2">
                <TabButton
                    label="Balance Sheet"
                    icon={CandlestickChart}
                    isActive={activeTab === 'dashboard'}
                    onClick={() => setActiveTab('dashboard')}
                />
                 <TabButton
                    label="Credit Cards"
                    icon={CreditCard}
                    isActive={activeTab === 'creditCards'}
                    onClick={() => setActiveTab('creditCards')}
                />
                <TabButton
                    label="Reports"
                    icon={FileText}
                    isActive={activeTab === 'reports'}
                    onClick={() => setActiveTab('reports')}
                />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
                {renderContent()}
            </div>
        </div>
    );
};

export default AnalyticsView;