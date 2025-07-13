
import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import type { SubCategory } from '../types';
import { X, Save } from 'lucide-react';

interface SubCategoryModalProps {
    onClose: () => void;
    categoryId: string;
    subCategoryToEdit?: SubCategory;
}

const SubCategoryModal: React.FC<SubCategoryModalProps> = ({ onClose, categoryId, subCategoryToEdit }) => {
    const { addSubCategory, updateSubCategory } = useAppContext();
    const isEditing = !!subCategoryToEdit;

    const [name, setName] = useState(subCategoryToEdit?.name || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        if (isEditing) {
            updateSubCategory(categoryId, { id: subCategoryToEdit.id, name: name.trim() });
        } else {
            addSubCategory(categoryId, { name: name.trim() });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">{isEditing ? 'Edit' : 'Add'} Subcategory</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subcategory Name</label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                required
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                        <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center gap-2">
                            <Save size={18} /> {isEditing ? 'Save' : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubCategoryModal;