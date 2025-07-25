import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import type { Account } from '../types';

interface ConfirmDeleteAccountModalProps {
    account: Account;
    transactionCount: number;
    onClose: () => void;
    onConfirm: () => void;
}

const ConfirmDeleteAccountModal: React.FC<ConfirmDeleteAccountModalProps> = ({ account, transactionCount, onClose, onConfirm }) => {
    const handleConfirm = () => {
        onConfirm();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex items-start">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                            <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-gray-100" id="modal-title">
                                Delete "{account.name}"?
                            </h3>
                            <div className="mt-2 space-y-2">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Are you sure you want to delete this account?
                                    {transactionCount > 0 && ` It has ${transactionCount} associated transaction(s).`}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    The account and all its transactions will be moved to the Trash and permanently deleted after 7 days.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={handleConfirm}
                    >
                        <Trash2 className="w-5 h-5 mr-2" />
                        Yes, Delete
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteAccountModal;
