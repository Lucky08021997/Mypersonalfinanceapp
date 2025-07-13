import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { HelpCircle, ArrowRight } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';

const CustomTooltip = ({ active, payload, formatCurrency }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="label text-sm font-semibold text-gray-800 dark:text-gray-200">{`${payload[0].name} : ${formatCurrency(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
};

const QuadrantTooltip: React.FC<{ text: string }> = ({ text }) => {
    const [show, setShow] = useState(false);
    return (
        <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
            <HelpCircle size={16} className="text-gray-400 dark:text-gray-500 cursor-pointer" />
            {show && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-800 text-white text-xs rounded-lg py-2 px-3 z-10 shadow-lg">
                    {text}
                </div>
            )}
        </div>
    );
};

const tooltips = {
    Assets: "Assets put money in your pocket. These are things you own that generate income or appreciate in value, like savings, investments, or property.",
    Liabilities: "Liabilities take money out of your pocket. These are debts you owe, like loans and credit card balances.",
    Income: "Income is the money flowing into your accounts, typically from your job (active) or assets (passive).",
    Expenses: "Expenses are the money flowing out to cover your lifestyle and liabilities."
};

interface QuadrantCardProps {
  title: 'Assets' | 'Liabilities' | 'Income' | 'Expenses';
  amount: number;
  description: string;
  color: 'green' | 'red';
  data: { name: string; value: number; fill: string }[];
  onDrillDown: () => void;
}

const QuadrantCard: React.FC<QuadrantCardProps> = ({ title, amount, description, color, data, onDrillDown }) => {
    const { formatCurrency } = useCurrency();
    const textColor = color === 'green' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400';
    
    return (
        <div className={`group bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 border rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl`}>
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{title}</h3>
                <QuadrantTooltip text={tooltips[title]} />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
            <p className={`text-4xl font-extrabold my-4 ${textColor}`}>{formatCurrency(amount)}</p>

            <div className="h-40">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={2}>
                                {data.map((entry) => <Cell key={`cell-${entry.name}`} fill={entry.fill} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip formatCurrency={formatCurrency}/>} />
                            <Legend iconSize={8} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px', color: 'var(--recharts-text-color)' }}/>
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-500 text-sm">
                        No data for this period.
                    </div>
                )}
            </div>
            
             <button onClick={onDrillDown} className="mt-4 text-sm font-semibold text-primary-600 dark:text-primary-400 flex items-center gap-1 group-hover:underline">
                View Details <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
        </div>
    );
};

export default QuadrantCard;