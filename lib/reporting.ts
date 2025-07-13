

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Transaction, Account, Category } from '../types';
import { CURRENCIES } from '../constants';

interface ReportData {
    transactions: Transaction[];
    accounts: Account[];
    categories: Category[];
    currencyCode: string;
}

interface ReportParams {
    reportType: string;
    dateRange: { start: Date; end: Date };
    data: ReportData;
}

const getCurrencySymbol = (currencyCode: string) => {
    return CURRENCIES.find(c => c.code === currencyCode)?.symbol || '$';
}

const formatCurrency = (value: number, currencyCode: string) => {
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currencyCode,
    }).format(value);
}

const formatDate = (date: Date) => date.toLocaleDateString();

// --- PDF Generation ---
export const exportToPdf = ({ reportType, dateRange, data }: ReportParams) => {
    const doc = new jsPDF();
    const { transactions, accounts, categories, currencyCode } = data;
    const accountMap = new Map(accounts.map(a => [a.id, a.name]));
    const categoryMap = new Map<string, Category>(categories.map(c => [c.id, c]));

    const title = `${reportType} Report`;
    const dateTitle = `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;
    
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(dateTitle, 14, 29);

    let body: (string|number)[][] = [];
    let head: string[][] = [];

    switch(reportType) {
        case 'Monthly Summary':
        case 'Income vs. Expense': {
            const income = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
            const expenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0);
            const net = income + expenses;
            head = [['Metric', 'Amount']];
            body = [
                ['Total Income', formatCurrency(income, currencyCode)],
                ['Total Expenses', formatCurrency(Math.abs(expenses), currencyCode)],
                ['Net Savings', formatCurrency(net, currencyCode)],
            ];
            break;
        }
        case 'Category Spending': {
            head = [['Category', 'Amount', 'Transactions']];
            const spending: {[key: string]: { amount: number, count: number }} = {};
            transactions.filter(t => t.amount < 0).forEach(t => {
                const catName = t.categoryId ? categoryMap.get(t.categoryId)?.name || 'Uncategorized' : 'Uncategorized';
                if (!spending[catName]) spending[catName] = { amount: 0, count: 0 };
                spending[catName].amount += Math.abs(t.amount);
                spending[catName].count++;
            });
            body = Object.entries(spending)
                .sort(([,a], [,b]) => b.amount - a.amount)
                .map(([name, data]) => [name, formatCurrency(data.amount, currencyCode), data.count]);
            break;
        }
        case 'Detailed Report': {
            head = [['Date', 'Description', 'Account', 'Category', 'Subcategory', 'Tags', 'Debit', 'Credit']];
            body = transactions.map(t => {
                const category = t.categoryId ? categoryMap.get(t.categoryId) : null;
                const subCategory = category && t.subCategoryId ? category.subcategories.find(sc => sc.id === t.subCategoryId) : null;
                const account = accountMap.get(t.accountId) || 'N/A';
                return [
                    formatDate(new Date(t.date)),
                    t.description,
                    account,
                    category?.name || 'Uncategorized',
                    subCategory?.name || '',
                    t.tags?.join(', ') || '',
                    t.amount < 0 ? formatCurrency(Math.abs(t.amount), currencyCode) : '',
                    t.amount >= 0 ? formatCurrency(t.amount, currencyCode) : '',
                ];
            });
            break;
        }
    }

    autoTable(doc, {
        head: head,
        body: body,
        startY: 35,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] },
    });

    doc.save(`${reportType.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

// --- XLSX Generation ---
export const exportToXlsx = ({ reportType, dateRange, data }: ReportParams) => {
    const { transactions, accounts, categories, currencyCode } = data;
    const accountMap = new Map(accounts.map(a => [a.id, a.name]));
    const categoryMap = new Map<string, Category>(categories.map(c => [c.id, c]));
    
    const workbook = XLSX.utils.book_new();
    let worksheet;
    let sheetData: any[] = [];

    switch(reportType) {
        case 'Monthly Summary':
        case 'Income vs. Expense': {
            const income = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
            const expenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
            const net = income - expenses;
            worksheet = XLSX.utils.aoa_to_sheet([
                ['Metric', 'Amount'],
                ['Total Income', income],
                ['Total Expenses', expenses],
                ['Net Savings', net],
            ]);
            // Apply currency format
            worksheet['B2'].z = `"${getCurrencySymbol(currencyCode)}"#,##0.00`;
            worksheet['B3'].z = `"${getCurrencySymbol(currencyCode)}"#,##0.00`;
            worksheet['B4'].z = `"${getCurrencySymbol(currencyCode)}"#,##0.00`;
            break;
        }
        case 'Category Spending': {
            const spending: {[key: string]: { amount: number, count: number }} = {};
            transactions.filter(t => t.amount < 0).forEach(t => {
                const catName = t.categoryId ? categoryMap.get(t.categoryId)?.name || 'Uncategorized' : 'Uncategorized';
                if (!spending[catName]) spending[catName] = { amount: 0, count: 0 };
                spending[catName].amount += Math.abs(t.amount);
                spending[catName].count++;
            });
            sheetData = Object.entries(spending)
                .sort(([,a], [,b]) => b.amount - a.amount)
                .map(([name, data]) => ({ Category: name, Amount: data.amount, Transactions: data.count }));
            worksheet = XLSX.utils.json_to_sheet(sheetData);
            // Apply currency format to 'Amount' column
            for (let i = 2; i <= sheetData.length + 1; i++) {
                if(worksheet[`B${i}`]) worksheet[`B${i}`].z = `"${getCurrencySymbol(currencyCode)}"#,##0.00`;
            }
            break;
        }
        case 'Detailed Report': {
            sheetData = transactions.map(t => {
                const category = t.categoryId ? categoryMap.get(t.categoryId) : null;
                const subCategory = category && t.subCategoryId ? category.subcategories.find(sc => sc.id === t.subCategoryId) : null;
                return {
                    Date: new Date(t.date),
                    Description: t.description,
                    Account: accountMap.get(t.accountId) || 'N/A',
                    Category: category?.name || 'Uncategorized',
                    Subcategory: subCategory?.name || '',
                    Tags: t.tags?.join(', ') || '',
                    Debit: t.amount < 0 ? Math.abs(t.amount) : null,
                    Credit: t.amount >= 0 ? t.amount : null,
                    Notes: t.notes || ''
                };
            });
            worksheet = XLSX.utils.json_to_sheet(sheetData);
            worksheet['A1'].v = "Date";
            // Apply formatting
            for (let i = 2; i <= sheetData.length + 1; i++) {
                if(worksheet[`A${i}`]) worksheet[`A${i}`].z = 'yyyy-mm-dd';
                if(worksheet[`G${i}`]) worksheet[`G${i}`].z = `"${getCurrencySymbol(currencyCode)}"#,##0.00`;
                if(worksheet[`H${i}`]) worksheet[`H${i}`].z = `"${getCurrencySymbol(currencyCode)}"#,##0.00`;
            }
            break;
        }
    }
    
    if (worksheet) {
        XLSX.utils.book_append_sheet(workbook, worksheet, reportType);
        XLSX.writeFile(workbook, `${reportType.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
    }
};