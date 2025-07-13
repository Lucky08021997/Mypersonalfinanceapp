import React from 'react';
import { X, Lightbulb, CheckCircle, BarChart, AlertTriangle, Sparkles } from 'lucide-react';
import type { FinancialAnalysis } from '../lib/gemini';

interface AIInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  insights: FinancialAnalysis | null;
  error: string | null;
}

const AIInsightsModal: React.FC<AIInsightsModalProps> = ({ isOpen, onClose, isLoading, insights, error }) => {
  if (!isOpen) return null;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-500"></div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Analyzing your finances...</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Our AI is crunching the numbers to provide you with personalized insights.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 text-red-600 dark:text-red-400">
          <AlertTriangle size={48} />
          <h3 className="text-lg font-semibold">An Error Occurred</h3>
          <p className="text-sm">{error}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Please try again later. The AI might be busy.</p>
        </div>
      );
    }
    
    if (insights) {
      return (
        <div className="space-y-6">
          <div className="bg-primary-50 dark:bg-primary-900/40 border border-primary-200 dark:border-primary-800 p-4 rounded-lg">
              <h4 className="flex items-center gap-2 font-bold text-lg text-primary-700 dark:text-primary-300">
                  <CheckCircle size={20} />
                  Financial Health Overview
              </h4>
              <p className="mt-2 text-gray-700 dark:text-gray-200">{insights.overview}</p>
          </div>

          <div>
              <h4 className="flex items-center gap-2 font-bold text-lg text-gray-800 dark:text-gray-100">
                  <BarChart size={20} />
                  Key Observations
              </h4>
              <ul className="mt-2 list-disc list-inside space-y-2 text-gray-700 dark:text-gray-200">
                  {insights.keyObservations.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
          </div>
          
          <div>
              <h4 className="flex items-center gap-2 font-bold text-lg text-gray-800 dark:text-gray-100">
                  <Lightbulb size={20} />
                  Actionable Advice
              </h4>
              <ul className="mt-2 list-disc list-inside space-y-2 text-gray-700 dark:text-gray-200">
                  {insights.actionableAdvice.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">{insights.disclaimer}</p>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-primary-600 dark:text-primary-400">
                  <Sparkles /> AI Financial Analysis
              </h2>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                  <X size={24} />
              </button>
          </div>
          <div className="p-6 flex-grow overflow-y-auto">
             {renderContent()}
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button type="button" onClick={onClose} className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
                  Close
              </button>
          </div>
      </div>
    </div>
  );
};

export default AIInsightsModal;