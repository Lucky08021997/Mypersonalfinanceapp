import React, { useState } from 'react';
import { X, Download } from 'lucide-react';

type ExportFormat = 'csv' | 'xlsx' | 'pdf';
type ExportMode = 'filtered' | 'selected';

interface ExportModalProps {
  onClose: () => void;
  onExport: (mode: ExportMode, format: ExportFormat) => void;
  selectedCount: number;
  filteredCount: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onClose, onExport, selectedCount, filteredCount }) => {
  const [format, setFormat] = useState<ExportFormat>('csv');

  const handleExportClick = (mode: ExportMode) => {
    onExport(mode, format);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Export Transactions</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 space-y-6">
            <div className="text-center">
                <p className="text-lg text-gray-700 dark:text-gray-300">What would you like to export?</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <button 
                    onClick={() => handleExportClick('filtered')}
                    className="text-center bg-primary-50 dark:bg-primary-900/40 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 px-4 py-3 rounded-lg font-semibold hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors flex flex-col items-center justify-center"
                 >
                    <Download className="mb-2 h-8 w-8"/>
                    <span className="text-base">Export All Transactions</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">({filteredCount} visible)</span>
                 </button>
                 <button 
                    onClick={() => handleExportClick('selected')}
                    className="text-center bg-primary-50 dark:bg-primary-900/40 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 px-4 py-3 rounded-lg font-semibold hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-700/50 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:border-gray-300 dark:disabled:border-gray-600 disabled:cursor-not-allowed flex flex-col items-center justify-center"
                 >
                    <Download className="mb-2 h-8 w-8"/>
                    <span className="text-base">Export Selected Transactions</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">({selectedCount} selected)</span>
                 </button>
            </div>
             <div className="flex items-center justify-center gap-2 pt-4">
                <label htmlFor="format" className="text-sm font-medium text-gray-700 dark:text-gray-300">File Format:</label>
                <select 
                    id="format"
                    value={format}
                    onChange={(e) => setFormat(e.target.value as ExportFormat)}
                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                    <option value="csv">CSV</option>
                    <option value="xlsx">XLSX</option>
                    <option value="pdf">PDF</option>
                </select>
            </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
};
