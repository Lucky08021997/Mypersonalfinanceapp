import React from 'react';
import { X, Printer, FileDown } from 'lucide-react';

interface ReportData {
    title: string;
    dateRange: { start: Date, end: Date };
    head: string[][];
    body: (string|number)[][];
}

interface ReportViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportData: ReportData;
    onExport: (format: 'pdf' | 'xlsx') => void;
}

const ReportViewerModal: React.FC<ReportViewerModalProps> = ({ isOpen, onClose, reportData, onExport }) => {
    if (!isOpen) return null;

    const { title, dateRange, head, body } = reportData;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-[70] p-4 print-this-wrapper">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col print-this">
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center no-print">
                    <h2 className="text-2xl font-bold">Report Preview</h2>
                    <div className="flex items-center gap-4">
                        <button onClick={handlePrint} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 font-semibold hover:text-primary-600">
                           <Printer size={16} /> Print
                        </button>
                         <button onClick={() => onExport('pdf')} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 font-semibold hover:text-primary-600">
                           <FileDown size={16} /> PDF
                        </button>
                         <button onClick={() => onExport('xlsx')} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 font-semibold hover:text-primary-600">
                           <FileDown size={16} /> Excel
                        </button>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Report Content */}
                <div className="p-8 flex-grow overflow-y-auto" id="report-content">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                           {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                         <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    {head[0].map((header, index) => (
                                        <th key={index} className="p-3 border-b-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {body.map((row, rowIndex) => (
                                    <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        {row.map((cell, cellIndex) => (
                                            <td key={cellIndex} className={`p-3 border-b border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-300 ${typeof cell === 'string' && (cell.startsWith('₹') || cell.startsWith('$') || cell.startsWith('€')) ? 'text-right' : ''}`}>
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {body.length === 0 && (
                            <div className="text-center p-8 text-gray-500">No data available for this report and date range.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportViewerModal;