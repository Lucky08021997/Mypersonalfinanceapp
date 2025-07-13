import React, { useState, useMemo } from 'react';
import CalculatorWrapper from './CalculatorWrapper';
import { useCurrency } from '../../hooks/useCurrency';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const EMICalculator: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { formatCurrency } = useCurrency();
    const [principal, setPrincipal] = useState(100000);
    const [rate, setRate] = useState(8.5);
    const [tenure, setTenure] = useState(5); // in years

    const { emi, totalPayable, totalInterest } = useMemo(() => {
        const p = principal;
        const r = rate / 12 / 100;
        const n = tenure * 12;

        if (p <= 0 || r <= 0 || n <= 0) {
            return { emi: 0, totalPayable: 0, totalInterest: 0 };
        }

        const emiValue = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const totalPayableValue = emiValue * n;
        const totalInterestValue = totalPayableValue - p;

        return {
            emi: emiValue,
            totalPayable: totalPayableValue,
            totalInterest: totalInterestValue,
        };
    }, [principal, rate, tenure]);

    const chartData = [
        { name: 'Principal Amount', value: principal, fill: '#3b82f6' },
        { name: 'Total Interest', value: totalInterest, fill: '#ef4444' },
    ];

    return (
        <CalculatorWrapper title="EMI Calculator" onClose={onClose}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Loan Amount ({formatCurrency(principal)})</label>
                        <input
                            type="range"
                            min="10000"
                            max="10000000"
                            step="10000"
                            value={principal}
                            onChange={(e) => setPrincipal(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Interest Rate ({rate.toFixed(2)} %)</label>
                        <input
                            type="range"
                            min="1"
                            max="20"
                            step="0.05"
                            value={rate}
                            onChange={(e) => setRate(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Loan Tenure ({tenure} years)</label>
                        <input
                            type="range"
                            min="1"
                            max="30"
                            step="1"
                            value={tenure}
                            onChange={(e) => setTenure(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        />
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg text-center">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Your Monthly EMI</h3>
                    <p className="text-4xl font-bold text-primary-600 dark:text-primary-400 my-4">{formatCurrency(emi)}</p>
                    <div className="h-48">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5}>
                                    {chartData.map((entry) => <Cell key={`cell-${entry.name}`} fill={entry.fill} />)}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex justify-around text-sm">
                        <div>
                            <p className="text-gray-600 dark:text-gray-400">Principal</p>
                            <p className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(principal)}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 dark:text-gray-400">Total Interest</p>
                            <p className="font-bold text-red-500">{formatCurrency(totalInterest)}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 dark:text-gray-400">Total Payable</p>
                            <p className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(totalPayable)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </CalculatorWrapper>
    );
};

export default EMICalculator;
