import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { LayoutDashboard, List, CandlestickChart, Banknote, Sparkles, X } from 'lucide-react';

const onboardingSteps = [
    {
        icon: LayoutDashboard,
        title: "Welcome to Financify!",
        text: "Let's take a quick tour of the key features to get you started on managing your finances.",
    },
    {
        icon: List,
        title: "Add & View Transactions",
        text: "Use the 'Transactions' tab to see all your financial activity in one place. Use the '+' button to add new transactions, transfers, or accounts.",
    },
    {
        icon: CandlestickChart,
        title: "Analyze Your Finances",
        text: "The 'Analytics' tab gives you a visual breakdown of your financial health, from net worth to spending habits.",
    },
    {
        icon: Banknote,
        title: "Manage Debts & Budgets",
        text: "Keep track of your loans in the 'Debts' tab and set spending limits in the 'Budgets' tab to stay on track.",
    },
    {
        icon: Sparkles,
        title: "Meet Your AI Assistant",
        text: "Have a question? Click the sparkle icon in the header to ask our AI assistant anything about your finances.",
    },
];

const OnboardingGuide: React.FC = () => {
    const { completeOnboarding, state } = useAppContext();
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < onboardingSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            completeOnboarding();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        completeOnboarding();
    };
    
    const { icon: Icon, title, text } = onboardingSteps[currentStep];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
                <div className="p-8 text-center">
                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-primary-100 dark:bg-primary-900/50 mb-6">
                        <Icon className="h-10 w-10 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
                    <p className="mt-3 text-gray-600 dark:text-gray-300">{text}</p>
                    
                    <div className="flex justify-center mt-6 space-x-2">
                        {onboardingSteps.map((_, index) => (
                            <div
                                key={index}
                                className={`h-2 rounded-full transition-all ${
                                    index === currentStep ? 'w-6 bg-primary-500' : 'w-2 bg-gray-300 dark:bg-gray-600'
                                }`}
                            />
                        ))}
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex justify-between items-center rounded-b-2xl">
                    <button 
                        onClick={handleSkip} 
                        className="text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-primary-600"
                    >
                        Skip
                    </button>
                    <div className="flex gap-2">
                         {currentStep > 0 && (
                            <button 
                                onClick={handlePrev} 
                                className="px-4 py-2 text-sm font-semibold rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                            >
                                Previous
                            </button>
                        )}
                        <button 
                            onClick={handleNext} 
                            className="px-6 py-2 text-sm font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700"
                        >
                            {currentStep === onboardingSteps.length - 1 ? "Let's Go!" : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingGuide;
