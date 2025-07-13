import React, { useState, useMemo } from 'react';
import CalculatorWrapper from './CalculatorWrapper';
import { useCurrency } from '../../hooks/useCurrency';

const SIPCalculator: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { formatCurrency } = useCurrency();
    const [monthlyInvestment, setMonthlyInvestment] = useState(5000);
    const [annualReturn, setAnnualReturn] = useState(12);
    const [duration, setDuration] = useState(10); // in years

    const { totalInvestment, maturityValue, wealthGained } = useMemo(() => {
        const i = annualReturn / 12 / 100;
        const n = duration * 12;
        const p = monthlyInvestment;

        if (p <= 0 || i <= 0 || n <= 0) {
            const invested = p * n;
            return { totalInvestment: invested, maturityValue: invested, wealthGained: 0 };
        }
        
        const M = p * ( (Math.pow(1 + i, n) - 1) / i ) * (1 + i);
        const invested = p * n;
        const gained = M - invested;

        return {
            totalInvestment: invested,
            maturityValue: M,
            wealthGained: gained,
        };
    }, [monthlyInvestment, annualReturn, duration]);

    return (
        <CalculatorWrapper title="SIP Calculator" onClose={onClose}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                <div className="space-y-6">
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Monthly Investment ({formatCurrency(monthlyInvestment)})</label>
                        <input
                            type="range" min="500" max="100000" step="500"
                            value={monthlyInvestment}
                            onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Expected Annual Return ({annualReturn} %)</label>
                        <input
                            type="range" min="1" max="30" step="0.5"
                            value={annualReturn}
                            onChange={(e) => setAnnualReturn(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Investment Duration ({duration} years)</label>
                        <input
                            type="range" min="1" max="40" step="1"
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        />
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg text-center flex flex-col justify-center">
                     <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Projected Value</h3>
                     <p className="text-4xl font-bold text-primary-600 dark:text-primary-400 my-4">{formatCurrency(maturityValue)}</p>
                     <div className="mt-4 flex justify-around text-sm">
                        <div>
                            <p className="text-gray-600 dark:text-gray-400">Total Investment</p>
                            <p className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(totalInvestment)}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 dark:text-gray-400">Wealth Gained</p>
                            <p className="font-bold text-green-600">{formatCurrency(wealthGained)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </CalculatorWrapper>
    );
};

export default SIPCalculator;
