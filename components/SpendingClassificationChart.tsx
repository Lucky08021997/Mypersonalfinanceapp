import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useCurrency } from '../hooks/useCurrency';
import { Transaction } from '../types';

const CLASSIFICATION_COLORS: Record<string, string> = {
    need: '#f97316', // orange-500
    want: '#8b5cf6', // purple-500
    must: '#ef4444', // red-500
    unclassified: '#6b7280', // gray-500
};

const CustomTooltip = ({ active, payload, formatCurrency }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="label text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">{`${payload[0].name} : ${formatCurrency(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
        <p className="text-sm">{message}</p>
    </div>
);

interface SpendingClassificationChartProps {
    transactions: Transaction[];
}

const SpendingClassificationChart: React.FC<SpendingClassificationChartProps> = ({ transactions }) => {
    const { formatCurrency } = useCurrency();

    const chartData = useMemo(() => {
        const spending = transactions
            .filter(t => t.amount < 0 && !t.isTransfer)
            .reduce((acc, t) => {
                const classification = t.classification || 'unclassified';
                const amount = Math.abs(t.amount);
                acc[classification] = (acc[classification] || 0) + amount;
                return acc;
            }, {} as Record<string, number>);

        return Object.entries(spending).map(([name, value]) => ({
            name: name,
            value,
            fill: CLASSIFICATION_COLORS[name] || '#A8A29E'
        }));
    }, [transactions]);
    
    return (
        <ResponsiveContainer width="100%" height={200}>
            {chartData.length > 0 ? (
                <PieChart>
                    <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={2}
                        labelLine={false}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                            const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
                            const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                            const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                            return (percent > 0.05) ? <text x={x} y={y} fill="currentColor" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs capitalize">{(percent * 100).toFixed(0)}%</text> : null;
                        }}
                    >
                        {chartData.map((entry) => <Cell key={`cell-${entry.name}`} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                    <Legend
                        iconSize={8}
                        wrapperStyle={{ fontSize: '12px', textTransform: 'capitalize', color: 'var(--recharts-text-color)' }}
                    />
                </PieChart>
            ) : <EmptyState message="No classified spending for this period."/>}
        </ResponsiveContainer>
    );
};

export default SpendingClassificationChart;