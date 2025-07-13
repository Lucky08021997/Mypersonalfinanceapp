import React, { useState, useMemo } from 'react';
import CalculatorWrapper from './CalculatorWrapper';
import { useCurrency } from '../../hooks/useCurrency';

const RetirementCalculator: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { formatCurrency } = useCurrency();
    const [currentAge, setCurrentAge] = useState(30);
    const [retirementAge, setRetirementAge] = useState(60);
    const [monthlyExpenses, setMonthlyExpenses] = useState(50000);
    const [inflationRate, setInflationRate] = useState(6);
    const [preRetirementReturn, setPreRetirementReturn] = useState(12);
    const [postRetirementReturn, setPostRetirementReturn] = useState(7);
    
    const { retirementCorpus, monthlySavings } = useMemo(() => {
        const yearsToRetirement = retirementAge - currentAge;
        if (yearsToRetirement <= 0) return { retirementCorpus: 0, monthlySavings: 0 };
        
        // Future value of monthly expenses at retirement
        const futureMonthlyExpenses = monthlyExpenses * Math.pow(1 + inflationRate / 100, yearsToRetirement);
        
        // Corpus needed at retirement using formula for corpus from which we can withdraw inflation adjusted amount
        // P = C * ( (1 - (1+g)^n / (1+r)^n) / (r-g) ) ; not using this complex formula for simplicity
        // Simplified approach: annual expenses / (real rate of return)
        const realPostRetirementReturn = ( (1 + postRetirementReturn/100) / (1 + inflationRate/100) ) - 1;
        
        if (realPostRetirementReturn <= 0) {
            return { retirementCorpus: Infinity, monthlySavings: Infinity };
        }
        
        const corpus = (futureMonthlyExpenses * 12) / realPostRetirementReturn;

        // SIP required to reach this corpus
        const i = preRetirementReturn / 12 / 100;
        const n = yearsToRetirement * 12;
        const sip = corpus * ( i / (Math.pow(1 + i, n) - 1) );

        return { retirementCorpus: corpus, monthlySavings: sip };
    }, [currentAge, retirementAge, monthlyExpenses, inflationRate, preRetirementReturn, postRetirementReturn]);

    return (
        <CalculatorWrapper title="Retirement Planner" onClose={onClose}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Your Details</h3>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Current Age: {currentAge}</label>
                        <input type="range" min="18" max="60" value={currentAge} onChange={e => setCurrentAge(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"/>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Retirement Age: {retirementAge}</label>
                        <input type="range" min={currentAge + 1} max="80" value={retirementAge} onChange={e => setRetirementAge(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"/>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Current Monthly Expenses: {formatCurrency(monthlyExpenses)}</label>
                        <input type="range" min="10000" max="300000" step="5000" value={monthlyExpenses} onChange={e => setMonthlyExpenses(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"/>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 pt-4 border-t dark:border-gray-700">Assumptions</h3>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Expected Inflation Rate: {inflationRate}%</label>
                        <input type="range" min="2" max="10" step="0.5" value={inflationRate} onChange={e => setInflationRate(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"/>
                    </div>
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Pre-Retirement Returns: {preRetirementReturn}%</label>
                        <input type="range" min="5" max="20" step="0.5" value={preRetirementReturn} onChange={e => setPreRetirementReturn(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"/>
                    </div>
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Post-Retirement Returns: {postRetirementReturn}%</label>
                        <input type="range" min="3" max="12" step="0.5" value={postRetirementReturn} onChange={e => setPostRetirementReturn(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"/>
                    </div>
                </div>
                 <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg text-center flex flex-col justify-center space-y-8">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Retirement Corpus Needed</h3>
                        <p className="text-4xl font-bold text-primary-600 dark:text-primary-400 my-2">{isFinite(retirementCorpus) ? formatCurrency(retirementCorpus) : "N/A"}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">This is the amount you'll need when you retire at age {retirementAge}.</p>
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Monthly Savings Required</h3>
                        <p className="text-4xl font-bold text-green-600 my-2">{isFinite(monthlySavings) ? formatCurrency(monthlySavings) : "N/A"}</p>
                         <p className="text-xs text-gray-600 dark:text-gray-400">You need to save this much every month to reach your goal.</p>
                    </div>
                </div>
            </div>
        </CalculatorWrapper>
    );
};

export default RetirementCalculator;
