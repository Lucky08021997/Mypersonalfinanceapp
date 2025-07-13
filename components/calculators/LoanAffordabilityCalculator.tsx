import React, { useState, useMemo } from 'react';
import CalculatorWrapper from './CalculatorWrapper';
import { useCurrency } from '../../hooks/useCurrency';

const LoanAffordabilityCalculator: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { formatCurrency } = useCurrency();
    const [monthlyIncome, setMonthlyIncome] = useState(75000);
    const [existingEMIs, setExistingEMIs] = useState(10000);
    const [rate, setRate] = useState(9);
    const [tenure, setTenure] = useState(5); // years
    const [foir, setFoir] = useState(50); // Fixed Obligation to Income Ratio

    const { eligibleLoanAmount, affordableEMI } = useMemo(() => {
        const disposableIncome = monthlyIncome - existingEMIs;
        const affordableEMIValue = (disposableIncome * foir) / 100;
        
        const r = rate / 12 / 100;
        const n = tenure * 12;

        if (r <= 0) return { eligibleLoanAmount: 0, affordableEMI: affordableEMIValue };

        const loanAmount = (affordableEMIValue / r) * (1 - (1 / Math.pow(1 + r, n)));
        
        return { eligibleLoanAmount: loanAmount, affordableEMI: affordableEMIValue };
    }, [monthlyIncome, existingEMIs, rate, tenure, foir]);

    return (
        <CalculatorWrapper title="Loan Affordability Calculator" onClose={onClose}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                <div className="space-y-4">
                     <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Your Financials</h3>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Net Monthly Income: {formatCurrency(monthlyIncome)}</label>
                        <input type="range" min="10000" max="500000" step="5000" value={monthlyIncome} onChange={e => setMonthlyIncome(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"/>
                    </div>
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Existing EMIs/Obligations: {formatCurrency(existingEMIs)}</label>
                        <input type="range" min="0" max="200000" step="1000" value={existingEMIs} onChange={e => setExistingEMIs(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"/>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 pt-4 border-t dark:border-gray-700">Loan Parameters</h3>
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Interest Rate: {rate}%</label>
                        <input type="range" min="5" max="20" step="0.25" value={rate} onChange={e => setRate(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"/>
                    </div>
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Loan Tenure: {tenure} years</label>
                        <input type="range" min="1" max="30" step="1" value={tenure} onChange={e => setTenure(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"/>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">FOIR / DTI Ratio: {foir}%</label>
                        <input type="range" min="30" max="70" step="5" value={foir} onChange={e => setFoir(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"/>
                         <p className="text-xs text-gray-500 mt-1">Percentage of income that can be used for EMIs. Banks typically use 40-60%.</p>
                    </div>
                </div>
                 <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg text-center flex flex-col justify-center space-y-8">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Eligible Loan Amount</h3>
                        <p className="text-4xl font-bold text-primary-600 dark:text-primary-400 my-2">{formatCurrency(eligibleLoanAmount)}</p>
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Affordable EMI</h3>
                        <p className="text-4xl font-bold text-green-600 my-2">{formatCurrency(affordableEMI)}</p>
                    </div>
                </div>
            </div>
        </CalculatorWrapper>
    );
};

export default LoanAffordabilityCalculator;
