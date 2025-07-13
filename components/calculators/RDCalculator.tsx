import React, { useState, useMemo } from 'react';
import CalculatorWrapper from './CalculatorWrapper';
import { useCurrency } from '../../hooks/useCurrency';

const RDCalculator: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { formatCurrency } = useCurrency();
    const [monthlyInstallment, setMonthlyInstallment] = useState(5000);
    const [rate, setRate] = useState(6.5);
    const [tenure, setTenure] = useState(5); // years

    const { maturityAmount, totalInterest } = useMemo(() => {
        const P = monthlyInstallment;
        const n = tenure * 12;
        const r = rate / 100;
        let M = 0;
        for (let i = 1; i <= n; i++) {
            M += P * Math.pow(1 + r / 4, (n - i + 1) / 3);
        }
        // This is an approximation. A more accurate formula is complex.
        // M = P * (( (1+i)^n - 1) / i ) where i is rate per period
        const i = r / 12; // monthly rate
        const accurateM = P * ( (Math.pow(1+i, n)-1)/i );
        
        const totalInvested = P * n;
        const interest = accurateM - totalInvested;
        
        return { maturityAmount: accurateM, totalInterest: interest };
    }, [monthlyInstallment, rate, tenure]);

    return (
        <CalculatorWrapper title="Recurring Deposit (RD) Calculator" onClose={onClose}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                <div className="space-y-6">
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Monthly Installment ({formatCurrency(monthlyInstallment)})</label>
                        <input type="range" min="500" max="50000" step="500" value={monthlyInstallment} onChange={(e) => setMonthlyInstallment(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Interest Rate ({rate.toFixed(2)} %)</label>
                        <input type="range" min="1" max="15" step="0.1" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Tenure ({tenure} years)</label>
                        <input type="range" min="1" max="10" step="1" value={tenure} onChange={(e) => setTenure(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg text-center flex flex-col justify-center">
                     <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Maturity Amount</h3>
                     <p className="text-4xl font-bold text-primary-600 dark:text-primary-400 my-4">{formatCurrency(maturityAmount)}</p>
                     <div className="mt-4 flex justify-around text-sm">
                        <div>
                            <p className="text-gray-600 dark:text-gray-400">Total Invested</p>
                            <p className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(monthlyInstallment * tenure * 12)}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 dark:text-gray-400">Interest Earned</p>
                            <p className="font-bold text-green-600">{formatCurrency(totalInterest)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </CalculatorWrapper>
    );
};

export default RDCalculator;
