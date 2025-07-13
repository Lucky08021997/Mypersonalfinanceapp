import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import type { Transaction } from '../types';
import { UploadCloud, X, Download, AlertTriangle, FileCheck, FileX } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface FileUploadModalProps {
    onClose: () => void;
}

type ParsedData = string[][];
type FailedRow = { rowNumber: number; rowData: string[]; error: string };

const REQUIRED_HEADERS = ['Date', 'Description', 'Debit Amount', 'Credit Amount', 'Category', 'Subcategory', 'Notes', 'Transaction Type'];

// Helper function to parse various date formats
const parseDateString = (dateStr: string): Date | null => {
    if (!dateStr) return null;
  
    const s = dateStr.trim();
    // Prioritize ISO format (YYYY-MM-DD), which `new Date()` handles well.
    if (/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/.test(s)) {
      const d = new Date(s);
      if (!isNaN(d.getTime())) return d;
    }

    const parts = s.match(/(\d+)/g);
    if (!parts || parts.length !== 3) return null;
  
    const [p1, p2, p3] = parts.map(Number);
  
    // Try DD/MM/YYYY
    if (p1 <= 31 && p2 <= 12 && p3 >= 1900) {
      const d = new Date(p3, p2 - 1, p1);
      // Check if date is valid (e.g., doesn't roll over)
      if (d.getFullYear() === p3 && d.getMonth() === p2 - 1 && d.getDate() === p1) {
        return d;
      }
    }
  
    // Try MM/DD/YYYY
    if (p1 <= 12 && p2 <= 31 && p3 >= 1900) {
        const d = new Date(p3, p1 - 1, p2);
        // Check if date is valid
        if (d.getFullYear() === p3 && d.getMonth() === p1 - 1 && d.getDate() === p2) {
          return d;
        }
    }
  
    return null;
};


export const FileUploadModal: React.FC<FileUploadModalProps> = ({ onClose }) => {
    const { addMultipleTransactions, activeDashboardData, addNotification } = useAppContext();
    const { accounts, categories } = activeDashboardData;

    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedData | null>(null);
    const [importingAccount, setImportingAccount] = useState<string>(accounts.length > 0 ? accounts[0].id : '');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [failedRows, setFailedRows] = useState<FailedRow[]>([]);
    const [importResult, setImportResult] = useState<{success: number, failed: number} | null>(null);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setIsLoading(true);
            setError(null);
            setParsedData(null);
            setFailedRows([]);
            setImportResult(null);

            const reader = new FileReader();
            const fileType = selectedFile.name.split('.').pop()?.toLowerCase();

            reader.onload = (event) => {
                try {
                    let data: string[][] = [];
                    if (fileType === 'csv' || fileType === 'txt') {
                        const text = event.target?.result as string;
                        const result = Papa.parse(text, { skipEmptyLines: true });
                        data = result.data as string[][];
                    } else if (fileType === 'xlsx' || fileType === 'xls') {
                        const workbook = XLSX.read(event.target?.result, { type: 'array' });
                        const sheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
                    } else {
                        throw new Error(`Unsupported file type .${fileType}.`);
                    }

                    if (data.length < 1) {
                        throw new Error('File is empty.');
                    }
                    const headers = data[0].map(h => h.trim());
                    const isValid = REQUIRED_HEADERS.length === headers.length && REQUIRED_HEADERS.every((value, index) => value === headers[index]);

                    if (!isValid) {
                        throw new Error(`Invalid headers. Expected: ${REQUIRED_HEADERS.join(', ')}`);
                    }
                    
                    setParsedData(data);
                } catch (err: any) {
                    setError(err.message || 'An error occurred while parsing the file.');
                    setFile(null);
                } finally {
                    setIsLoading(false);
                }
            };
            
            reader.onerror = () => {
                setError('Failed to read file.');
                setIsLoading(false);
            };

            if (fileType === 'pdf') {
                setError('PDF import is not supported. Please convert your file to a CSV or XLSX format.');
                setIsLoading(false);
                setFile(null);
                return;
            }

            if (fileType === 'xlsx' || fileType === 'xls') {
                reader.readAsArrayBuffer(selectedFile);
            } else if (fileType === 'csv' || fileType === 'txt') {
                reader.readAsText(selectedFile);
            } else {
                setError(`Unsupported file type .${fileType}. Please upload CSV, XLSX, XLS, or TXT.`);
                setIsLoading(false);
                setFile(null);
            }
        }
    };
    
    const handleImport = () => {
        if (!parsedData || !importingAccount || parsedData.length < 2) return;
    
        setIsLoading(true);
        const dataToImport = parsedData.slice(1);
        const transactionsToAdd: Omit<Transaction, 'id'>[] = [];
        const localFailedRows: FailedRow[] = [];
    
        dataToImport.forEach((row, index) => {
            const [dateStr, description, debitStr, creditStr, categoryName, subCategoryName, notes, transactionTypeStr] = row;
            
            let error = '';
            let amount = 0;
            let isTransfer = false;
            
            const transactionDate = parseDateString(dateStr);
            if (!transactionDate) {
                error = 'Invalid or unsupported date format.';
            } else if (!description?.trim()) {
                error = 'Description is required.';
            }
            
            const debit = parseFloat(debitStr) || 0;
            const credit = parseFloat(creditStr) || 0;
            const transactionType = transactionTypeStr?.trim().toLowerCase();
    
            if (!error) {
                if (!transactionType || !['income', 'expense', 'transfer'].includes(transactionType)) {
                    error = 'Invalid Transaction Type. Must be Income, Expense, or Transfer.';
                } else {
                    switch(transactionType) {
                        case 'income':
                            if (debit > 0) error = 'Income transaction cannot have a debit amount.';
                            else if (credit <= 0) error = 'Income transaction must have a positive credit amount.';
                            else amount = credit;
                            break;
                        case 'expense':
                            if (credit > 0) error = 'Expense transaction cannot have a credit amount.';
                            else if (debit <= 0) error = 'Expense transaction must have a positive debit amount.';
                            else amount = -debit;
                            break;
                        case 'transfer':
                            if (debit > 0 && credit > 0) error = 'Transfer cannot have both debit and credit.';
                            else if (debit === 0 && credit === 0) error = 'Transfer must have a debit or credit amount.';
                            else {
                                amount = credit - debit;
                                isTransfer = true;
                            }
                            break;
                    }
                }
            }
    
            if (error) {
                localFailedRows.push({ rowNumber: index + 2, rowData: row, error });
                return;
            }
            
            const category = categories.find(c => c.name.trim().toLowerCase() === categoryName?.trim().toLowerCase());
            const subCategory = category?.subcategories.find(sc => sc.name.trim().toLowerCase() === subCategoryName?.trim().toLowerCase());
    
            transactionsToAdd.push({
                accountId: importingAccount,
                date: transactionDate.toISOString(),
                description: description.trim(),
                amount,
                categoryId: category?.id,
                subCategoryId: subCategory?.id,
                notes: notes?.trim() || undefined,
                isTransfer,
            });
        });
        
        if(transactionsToAdd.length > 0) {
            addMultipleTransactions(transactionsToAdd);
        }

        const account = accounts.find(a => a.id === importingAccount);
        if (transactionsToAdd.length > 0) {
            addNotification(`${transactionsToAdd.length} transactions imported to ${account?.name || 'account'}.`, 'success');
        }
        if (localFailedRows.length > 0) {
            addNotification(`${localFailedRows.length} rows failed to import. Download the log for details.`, 'error');
        }

        setImportResult({ success: transactionsToAdd.length, failed: localFailedRows.length });
        setFailedRows(localFailedRows);
        setIsLoading(false);
        
        if (localFailedRows.length === 0) {
             setTimeout(onClose, 1000);
        }
    };

     const handleDownloadLog = () => {
        if (failedRows.length === 0) return;

        const logData = failedRows.map(item => ({
            'Row Number': item.rowNumber,
            'Error': item.error,
            ...REQUIRED_HEADERS.reduce((acc, header, index) => {
                acc[header] = item.rowData[index] || '';
                return acc;
            }, {} as Record<string, any>)
        }));

        const csv = Papa.unparse(logData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `import-error-log.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const downloadSample = () => {
        const sampleCsv = `${REQUIRED_HEADERS.join(',')}\n"27/10/2023","Coffee Shop","5.75","","Groceries","Snacks","Morning Coffee","Expense"\n"2023-10-26","Paycheck","","2500.00","Salary","","","Income"\n"10-24-2023","Transfer to Savings","500.00","","","","","Transfer"`;
        const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "sample-transactions.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    const renderContent = () => {
        if (importResult) {
            return (
                <div className="text-center p-8">
                    <h3 className="text-xl font-bold mb-4">Import Complete</h3>
                    <div className="flex justify-center gap-8">
                        <div className="text-green-500">
                            <FileCheck className="h-12 w-12 mx-auto"/>
                            <p className="text-2xl font-bold mt-2">{importResult.success}</p>
                            <p>Successful</p>
                        </div>
                        <div className={importResult.failed > 0 ? "text-red-500" : "text-gray-500"}>
                            <FileX className="h-12 w-12 mx-auto"/>
                            <p className="text-2xl font-bold mt-2">{importResult.failed}</p>
                            <p>Failed</p>
                        </div>
                    </div>
                    {failedRows.length > 0 && (
                        <div className="mt-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Some rows could not be imported. Download the log for details.</p>
                            <button onClick={handleDownloadLog} className="flex mx-auto items-center gap-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                <Download size={16}/> Download Error Log
                            </button>
                        </div>
                    )}
                </div>
            );
        }

        if (parsedData) {
            return (
                <div className="space-y-4">
                    <div>
                        <label htmlFor="importingAccount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Import Into Account</label>
                        <select id="importingAccount" value={importingAccount} onChange={(e) => setImportingAccount(e.target.value)} className="mt-1 block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data Preview</p>
                        {parsedData.length < 2 ? (
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center text-gray-500 dark:text-gray-400">
                                The uploaded file contains headers but no data rows to import.
                            </div>
                        ) : (
                            <div className="overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg max-h-64">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                                        <tr>
                                            {parsedData[0].map((header, index) => (
                                                <th key={index} className="p-2 font-semibold text-left text-xs text-gray-600 dark:text-gray-300 uppercase whitespace-nowrap">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800">
                                        {parsedData.slice(1, 11).map((row, rowIndex) => (
                                            <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-800/50"}>
                                                {row.map((cell, cellIndex) => (
                                                    <td key={cellIndex} className="p-2 border-t border-gray-200 dark:border-gray-700 truncate max-w-[150px] whitespace-nowrap">{cell}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {parsedData.length > 11 && (
                                    <div className="p-2 text-center text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 sticky bottom-0">
                                        ...and {parsedData.length - 11} more rows.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                <label htmlFor="file-upload" className="mt-4 block text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer">
                    {isLoading ? 'Processing...' : file ? file.name : 'Click to upload or drag and drop'}
                </label>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".csv,.txt,.xlsx,.xls" disabled={isLoading} />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">CSV, XLSX, XLS, or TXT files supported.</p>
                {error && 
                    <div className="mt-4 w-full bg-red-100 dark:bg-red-900/40 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative flex items-start gap-3 text-left">
                        <AlertTriangle className="h-5 w-5 mt-0.5 text-red-500 flex-shrink-0"/>
                        <p className="text-sm">{error}</p>
                    </div>
                }
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-2xl font-bold">Import Bank Statement</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X size={24} /></button>
                </div>

                <div className="flex-grow p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Import Instructions</h3>
                            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                                <p><strong className="font-semibold text-gray-700 dark:text-gray-200">1. File Format:</strong> Use CSV, XLSX, XLS or TXT.</p>
                                <div>
                                    <p><strong className="font-semibold text-gray-700 dark:text-gray-200">2. Column Headers:</strong> The first row must contain these exact headers in order:</p>
                                    <ul className="list-none mt-2 bg-gray-100 dark:bg-gray-900/50 p-3 rounded-md text-xs font-mono">
                                        {REQUIRED_HEADERS.map(h => <li key={h}>{h}</li>)}
                                    </ul>
                                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/50 p-2 rounded-md">
                                        <strong>Date Column:</strong> Use standard formats like <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">DD/MM/YYYY</code> or <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">YYYY-MM-DD</code>.
                                    </div>
                                </div>
                                <p><strong className="font-semibold text-gray-700 dark:text-gray-200">3. Upload & Review:</strong> Upload, select an account, review the data, and import.</p>
                            </div>
                            <button onClick={downloadSample} className="mt-4 flex w-full justify-center items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/50 font-semibold p-2 rounded-md border border-primary-500 transition-colors">
                                <Download size={16} /> Download Sample Template
                            </button>
                        </div>

                        <div className="lg:col-span-3">
                           {renderContent()}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2 flex-shrink-0">
                   {importResult ? (
                       <button type="button" onClick={onClose} className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors">Done</button>
                   ) : (
                       <>
                           <button type="button" onClick={onClose} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                           <button onClick={handleImport} disabled={!parsedData || isLoading || parsedData.length < 2 || !importingAccount} className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-primary-400/50 dark:disabled:bg-primary-800/50 disabled:cursor-not-allowed">
                               {isLoading ? 'Importing...' : `Import ${parsedData ? Math.max(0, parsedData.length - 1) : 0} Transactions`}
                           </button>
                       </>
                   )}
                </div>
            </div>
        </div>
    );
};