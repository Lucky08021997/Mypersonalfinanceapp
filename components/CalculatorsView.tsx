import React, { useState } from 'react';
import {
    Calculator, Coins, Percent, Landmark, PiggyBank, Briefcase, HandCoins, Building, TrendingUp, ShieldCheck, Target,
} from 'lucide-react';

import CalculatorCard from './calculators/CalculatorCard';
import EMICalculator from './calculators/EMICalculator';
import SIPCalculator from './calculators/SIPCalculator';
import FDCalculator from './calculators/FDCalculator';
import RDCalculator from './calculators/RDCalculator';
import RetirementCalculator from './calculators/RetirementCalculator';
import LoanAffordabilityCalculator from './calculators/LoanAffordabilityCalculator';
import IncomeTaxCalculator from './calculators/IncomeTaxCalculator';
import NetWorthCalculator from './calculators/NetWorthCalculator';
import CompoundInterestCalculator from './calculators/CompoundInterestCalculator';
import GoalBasedCalculator from './calculators/GoalBasedCalculator';

type CalculatorId =
    | 'emi' | 'sip' | 'fd' | 'rd' | 'retirement' | 'loanAffordability'
    | 'incomeTax' | 'netWorth' | 'compoundInterest' | 'goalBased';

const calculators: {
    id: CalculatorId;
    title: string;
    description: string;
    icon: React.ElementType;
    component: React.ElementType;
}[] = [
    { id: 'emi', title: 'EMI Calculator', description: 'Plan your loan repayments', icon: Coins, component: EMICalculator },
    { id: 'sip', title: 'SIP Calculator', description: 'Project investment growth', icon: TrendingUp, component: SIPCalculator },
    { id: 'fd', title: 'FD Calculator', description: 'Calculate fixed deposit returns', icon: Landmark, component: FDCalculator },
    { id: 'rd', title: 'RD Calculator', description: 'Estimate recurring deposit maturity', icon: PiggyBank, component: RDCalculator },
    { id: 'retirement', title: 'Retirement Planner', description: 'Estimate your retirement corpus', icon: Briefcase, component: RetirementCalculator },
    { id: 'loanAffordability', title: 'Loan Affordability', description: 'Check your loan eligibility', icon: HandCoins, component: LoanAffordabilityCalculator },
    { id: 'incomeTax', title: 'Income Tax Calculator', description: 'For India (Old vs New Regime)', icon: Building, component: IncomeTaxCalculator },
    { id: 'netWorth', title: 'Net Worth Calculator', description: 'Assess your financial health', icon: ShieldCheck, component: NetWorthCalculator },
    { id: 'compoundInterest', title: 'Compound Interest', description: 'See the power of compounding', icon: Percent, component: CompoundInterestCalculator },
    { id: 'goalBased', title: 'Goal Planner', description: 'Plan for your financial goals', icon: Target, component: GoalBasedCalculator },
];

const CalculatorsView: React.FC = () => {
    const [activeCalculator, setActiveCalculator] = useState<CalculatorId | null>(null);

    const openCalculator = (id: CalculatorId) => setActiveCalculator(id);
    const closeCalculator = () => setActiveCalculator(null);

    const ActiveCalculatorComponent = calculators.find(c => c.id === activeCalculator)?.component;

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Financial Calculators</h2>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Tools to help you plan your financial future.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {calculators.map((calc) => (
                    <CalculatorCard
                        key={calc.id}
                        title={calc.title}
                        description={calc.description}
                        icon={calc.icon}
                        onClick={() => openCalculator(calc.id)}
                    />
                ))}
            </div>

            {ActiveCalculatorComponent && (
                <ActiveCalculatorComponent onClose={closeCalculator} />
            )}
        </div>
    );
};

export default CalculatorsView;
