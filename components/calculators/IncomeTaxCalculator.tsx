import React, { useState, useMemo } from 'react';
import CalculatorWrapper from './CalculatorWrapper';
import { useCurrency } from '../../hooks/useCurrency';

// Simplified tax calculation logic for demonstration.
const calculateTax = (income: number, regime: 'old' | 'new', age: number, deductions: { c80: number; d80: number; }) => {
    let taxableIncome = income - deductions.c80 - deductions.d80;
    
    // Standard deduction
    if (regime === 'old') {
        taxableIncome -= 50000;
    } else { // New regime also has it now
        taxableIncome -= 50000;
    }

    taxableIncome = Math.max(0, taxableIncome);
    
    let tax = 0;
    if (regime === 'new') {
        if (taxableIncome > 1500000) tax += (taxableIncome - 1500000) * 0.30;
        if (taxableIncome > 1200000) tax += (Math.min(taxableIncome, 1500000) - 1200000) * 0.20;
        if (taxableIncome > 900000) tax += (Math.min(taxableIncome, 1200000) - 900000) * 0.15;
        if (taxableIncome > 600000) tax += (Math.min(taxableIncome, 900000) - 600000) * 0.10;
        if (taxableIncome > 300000) tax += (Math.min(taxableIncome, 600000) - 300000) * 0.05;
    } else { // old regime
        let exemption = 250000;
        if (age >= 80) exemption = 500000;
        else if (age >= 60) exemption = 300000;
        
        let slabIncome = taxableIncome - exemption;
        if (slabIncome > 0) {
            if (slabIncome > 500000) tax += (slabIncome - 500000) * 0.20;
            if (slabIncome > 250000) tax += (Math.min(slabIncome, 500000) - 250000) * 0.20;
            if (slabIncome > 0) tax += Math.min(slabIncome, 250000) * 0.05;
        }
    }
    
    // Simplified rebate u/s 87A
    if (regime === 'new' && taxableIncome <= 700000) tax = 0;
    if (regime === 'old' && taxableIncome <= 500000) tax = 0;
    
    // Cess (4%)
    tax = tax * 1.04;

    return tax;
};


const IncomeTaxCalculator: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { formatCurrency } = useCurrency();
    const [annualIncome, setAnnualIncome] = useState(1200000);
    const [deductions80C, setDeductions80C] = useState(150000);
    const [deductions80D, setDeductions80D] = useState(25000);
    const [age, setAge] = useState(40);

    const { oldRegimeTax, newRegimeTax } = useMemo(() => {
        const income = annualIncome;
        const oldTax = calculateTax(income, 'old', age, { c80: deductions80C, d80: deductions80D });
        const newTax = calculateTax(income, 'new', age, { c80: 0, d80: 0 }); // No deductions in new regime
        return { oldRegimeTax: oldTax, newRegimeTax: newTax };
    }, [annualIncome, deductions80C, deductions80D, age]);

    const betterOption = newRegimeTax < oldRegimeTax ? 'New Regime' : 'Old Regime';
    
    return (
        <CalculatorWrapper title="Income Tax Calculator (India)" onClose={onClose}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Your Income & Deductions</h3>
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Annual Income: {formatCurrency(annualIncome)}</label>
                        <input type="range" min="300000" max="5000000" step="10000" value={annualIncome} onChange={e => setAnnualIncome(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"/>
                    </div>
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">80C Deductions: {formatCurrency(deductions80C)}</label>
                        <input type="range" min="0" max="150000" step="5000" value={deductions80C} onChange={e => setDeductions80C(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"/>
                    </div>
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">80D (Medical): {formatCurrency(deductions80D)}</label>
                        <input type="range" min="0" max="100000" step="1000" value={deductions80D} onChange={e => setDeductions80D(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"/>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Your Age: {age}</label>
                        <input type="range" min="18" max="100" value={age} onChange={e => setAge(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"/>
                    </div>
                </div>
                 <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg text-center flex flex-col justify-center">
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Old Regime Tax</h3>
                            <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 my-2">{formatCurrency(oldRegimeTax)}</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">New Regime Tax</h3>
                            <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 my-2">{formatCurrency(newRegimeTax)}</p>
                        </div>
                    </div>
                     <div className="mt-8 bg-primary-100 dark:bg-primary-900/50 p-4 rounded-lg">
                         <h4 className="text-md font-bold text-primary-700 dark:text-primary-300">Better Option for You</h4>
                         <p className="text-2xl font-extrabold text-primary-600 dark:text-primary-400 mt-1">{betterOption}</p>
                     </div>
                </div>
            </div>
        </CalculatorWrapper>
    );
};

export default IncomeTaxCalculator;
