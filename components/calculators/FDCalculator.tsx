import React, { useState, useMemo } from 'react';
import CalculatorWrapper from './CalculatorWrapper';
import { useCurrency } from '../../hooks/useCurrency';

const FDCalculator: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { formatCurrency } = useCurrency();
    const [principal, setPrincipal] = useState(100000);
    const [rate, setRate] = useState(7);
    const [tenure, setTenure] = useState(5); // years
    const [compounding, setCompounding] = useState(4); // Quarterly

    const { maturityAmount, interestEarned } = useMemo(() => {
        const n = compounding;
        const t = tenure;
        const A = principal * Math.pow((1 + (rate / 100) / n), n * t);
        const interest = A - principal;
        return { maturityAmount: A, interestEarned: interest };
    }, [principal, rate, tenure, compounding]);

    return (
        <CalculatorWrapper title="Fixed Deposit (FD) Calculator" onClose={onClose}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Deposit Amount ({formatCurrency(principal)})</label>
                        <input type="range" min="1000" max="10000000" step="1000" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Interest Rate ({rate.toFixed(2)} %)</label>
                        <input type="range" min="1" max="15" step="0.1" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Tenure ({tenure} years)</label>
                        <input type="range" min="1" max="20" step="1" value={tenure} onChange={(e) => setTenure(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Compounding Frequency</label>
                        <select value={compounding} onChange={(e) => setCompounding(Number(e.target.value))} className="w-full mt-1 form-select bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md">
                            <option value="1">Annually</option>
                            <option value="2">Half-Yearly</option>
                            <option value="4">Quarterly</option>
                            <option value="12">Monthly</option>
                        </select>
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg text-center flex flex-col justify-center">
                     <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Maturity Amount</h3>
                     <p className="text-4xl font-bold text-primary-600 dark:text-primary-400 my-4">{formatCurrency(maturityAmount)}</p>
                     <div className="mt-4 flex justify-around text-sm">
                        <div>
                            <p className="text-gray-600 dark:text-gray-400">Principal</p>
                            <p className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(principal)}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 dark:text-gray-400">Interest Earned</p>
                            <p className="font-bold text-green-600">{formatCurrency(interestEarned)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </CalculatorWrapper>
    );
};

export default FDCalculator;
