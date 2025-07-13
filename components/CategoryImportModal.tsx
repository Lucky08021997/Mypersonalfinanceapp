import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { UploadCloud, X, AlertTriangle, Download } from 'lucide-react';
import Papa from 'papaparse';

interface CategoryImportModalProps {
    onClose: () => void;
}

type ParsedRow = { Category: string; Subcategory: string };

const REQUIRED_HEADERS = ['Category', 'Subcategory'];

const CategoryImportModal: React.FC<CategoryImportModalProps> = ({ onClose }) => {
    const { importCategories } = useAppContext();
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedRow[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setIsLoading(true);
            setError(null);
            setParsedData(null);

            if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
                Papa.parse(selectedFile, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        const headers = results.meta.fields;
                        if (!headers || headers.length > 2 || headers[0] !== REQUIRED_HEADERS[0] || (headers.length === 2 && headers[1] !== REQUIRED_HEADERS[1])) {
                             setError(`Invalid file structure. Headers must be: ${REQUIRED_HEADERS.join(', ')}.`);
                             setIsLoading(false);
                             return;
                        }
                        
                        const data = results.data as ParsedRow[];
                        const validData = data.map(row => ({
                            category: row.Category,
                            subcategory: row.Subcategory
                        })).filter(row => row.category && row.category.trim() !== '');

                        setParsedData(validData.map(d => ({ Category: d.category, Subcategory: d.subcategory })));
                        setIsLoading(false);
                    },
                    error: (err: any) => {
                        setError(`Error parsing file: ${err.message}`);
                        setIsLoading(false);
                    }
                });
            } else {
                setError('Unsupported file type. Please upload a CSV file.');
                setIsLoading(false);
            }
        }
    };
    
    const handleImport = () => {
        if (!parsedData) return;
        const dataToImport = parsedData.map(row => ({ category: row.Category, subcategory: row.Subcategory }));
        importCategories(dataToImport);
        onClose();
    };

    const downloadSample = () => {
        const sampleCsv = `${REQUIRED_HEADERS.join(',')}\nUtilities,Electricity\nUtilities,Water\nFood,Groceries\nEntertainment,\n`;
        const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "sample-categories.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Import Categories</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X size={24} /></button>
                </div>

                <div className="p-6 flex-grow overflow-y-auto">
                    {!parsedData ? (
                        <div className="flex flex-col items-center justify-center h-full">
                             <div className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                <label htmlFor="category-file-upload" className="mt-4 block text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer">
                                    { file ? file.name : 'Click to upload a file'}
                                </label>
                                <input id="category-file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".csv" />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">CSV files supported.</p>
                             </div>
                             {error && 
                                <div className="mt-4 w-full bg-red-100 dark:bg-red-900/40 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 mt-0.5 text-red-500"/>
                                    <p className="text-sm">{error}</p>
                                </div>
                             }
                             <button onClick={downloadSample} className="mt-6 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium">
                                <Download size={16} /> Download Sample Template
                             </button>
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data Preview (up to 10 rows)</p>
                            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                                        <tr>
                                            <th className="p-2 font-semibold text-left text-xs text-gray-600 dark:text-gray-300 uppercase">Category</th>
                                            <th className="p-2 font-semibold text-left text-xs text-gray-600 dark:text-gray-300 uppercase">Subcategory</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800">
                                        {parsedData.slice(0, 10).map((row, rowIndex) => (
                                            <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-800/50"}>
                                                <td className="p-2 border-t border-gray-200 dark:border-gray-700 truncate max-w-[200px] whitespace-nowrap">{row.Category}</td>
                                                <td className="p-2 border-t border-gray-200 dark:border-gray-700 truncate max-w-[200px] whitespace-nowrap">{row.Subcategory}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                 {parsedData.length > 10 && (
                                    <div className="p-2 text-center text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50">
                                        ...and {parsedData.length - 10} more rows.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                    <button onClick={handleImport} disabled={!parsedData || isLoading || parsedData.length < 1} className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-primary-400/50 dark:disabled:bg-primary-800/50 disabled:cursor-not-allowed">
                        {isLoading ? 'Loading...' : `Import ${parsedData ? parsedData.length : 0} Rows`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CategoryImportModal;