import React, { useState, useMemo } from 'react';
import CalculatorWrapper from './CalculatorWrapper';
import { useCurrency } from '../../hooks/useCurrency';

const GoalBasedCalculator: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { formatCurrency } = useCurrency();
    const [goalAmount, setGoalAmount] = useState(1000000);
    const [timeFrame, setTimeFrame] = useState(10); // years
    const [expectedReturn, setExpectedReturn] = useState(12);

    const { monthlyInvestment, oneTimeInvestment } = useMemo(() => {
        const i = expectedReturn / 12 / 100; // monthly rate
        const n = timeFrame * 12;
        
        if (n <= 0 || i <= 0) return { monthlyInvestment: 0, oneTimeInvestment: goalAmount };

        // SIP required
        const sip = goalAmount * ( i / (Math.pow(1 + i, n) - 1) );

        // Lumpsum required
        const lumpsum = goalAmount / Math.pow(1 + (expectedReturn / 100), timeFrame);
        
        return { monthlyInvestment: sip, oneTimeInvestment: lumpsum };
    }, [goalAmount, timeFrame, expectedReturn]);

    return (
        <CalculatorWrapper title="Goal-Based Investment Planner" onClose={onClose}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                <div className="space-y-6">
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Goal Amount: {formatCurrency(goalAmount)}</label>
                        <input type="range" min="10000" max="10000000" step="10000" value={goalAmount} onChange={e => setGoalAmount(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"/>
                    </div>
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Time Frame: {timeFrame} years</label>
                        <input type="range" min="1" max="30" step="1" value={timeFrame} onChange={e => setTimeFrame(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"/>
                    </div>
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Expected Annual Return: {expectedReturn}%</label>
                        <input type="range" min="1" max="25" step="0.5" value={expectedReturn} onChange={e => setExpectedReturn(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"/>
                    </div>
                </div>
                 <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg text-center flex flex-col justify-center space-y-8">
                     <div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Monthly Investment (SIP)</h3>
                        <p className="text-4xl font-bold text-primary-600 dark:text-primary-400 my-2">{formatCurrency(monthlyInvestment)}</p>
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">One-Time (Lumpsum)</h3>
                        <p className="text-4xl font-bold text-green-600 my-2">{formatCurrency(oneTimeInvestment)}</p>
                    </div>
                </div>
            </div>
        </CalculatorWrapper>
    );
};

export default GoalBasedCalculator;
