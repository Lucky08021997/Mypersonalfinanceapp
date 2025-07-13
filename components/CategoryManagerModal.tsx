
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import type { Category, SubCategory } from '../types';
import { X, Plus, Trash2, Edit, Save, Upload, Download, ArrowUp, ArrowDown, Search, ChevronRight, Check } from 'lucide-react';
import * as icons from 'lucide-react';
import Papa from 'papaparse';
import CategoryImportModal from './CategoryImportModal';
import SubCategoryModal from './SubCategoryModal';
import { CATEGORY_COLORS } from '../constants';

const DynamicIcon = ({ name, ...props }: { name: string; [key: string]: any }) => {
    const LucideIcon = (icons as any)[name] || icons.Tag;
    return <LucideIcon {...props} />;
};

const ColorPicker: React.FC<{ value: string; onChange: (color: string) => void }> = ({ value, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
        <div className="grid grid-cols-6 gap-2">
            {CATEGORY_COLORS.map(color => (
                <button
                    key={color}
                    type="button"
                    onClick={() => onChange(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform transform hover:scale-110 ${value === color ? 'border-primary-500' : 'border-gray-300 dark:border-gray-600'}`}
                    style={{ backgroundColor: color }}
                />
            ))}
        </div>
    </div>
);


interface CategoryManagerModalProps {
  onClose: () => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ onClose }) => {
    const { activeDashboardData, addCategory, updateCategory, deleteCategory, addSubCategory, deleteSubCategory, reorderCategory, addNotification } = useAppContext();
    const { categories, transactions } = activeDashboardData;

    const [searchTerm, setSearchTerm] = useState('');
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [isImportModalOpen, setImportModalOpen] = useState(false);
    const [subCategoryModalState, setSubCategoryModalState] = useState<{
        isOpen: boolean;
        categoryId?: string;
        subCategoryToEdit?: SubCategory;
    }>({ isOpen: false });

    // State for the "Add/Edit" panel
    const [panelName, setPanelName] = useState('');
    const [panelColor, setPanelColor] = useState(CATEGORY_COLORS[0]);

    const isCategoryInUse = (categoryId: string) => transactions.some(t => t.categoryId === categoryId);
    const isSubCategoryInUse = (subCategoryId: string) => transactions.some(t => t.subCategoryId === subCategoryId);
    
    const handleSelectForEdit = (category: Category) => {
        setEditingCategory(category);
        setPanelName(category.name);
        setPanelColor(category.color || CATEGORY_COLORS[0]);
    };
    
    const clearPanel = () => {
        setEditingCategory(null);
        setPanelName('');
        setPanelColor(CATEGORY_COLORS[0]);
    };

    const handlePanelSubmit = () => {
        if (!panelName.trim()) {
            addNotification('Category name cannot be empty.', 'error');
            return;
        }

        if (editingCategory) {
            updateCategory({ id: editingCategory.id, name: panelName, icon: 'Tag', color: panelColor });
        } else {
            addCategory({ name: panelName, icon: 'Tag', color: panelColor });
        }
        clearPanel();
    };
    
    const handleDeleteCategory = (id: string) => {
        if(isCategoryInUse(id)) {
            addNotification('This category is in use. Please reassign transactions before deleting it.', 'error');
            return;
        }
        if (editingCategory?.id === id) {
            clearPanel();
        }
        deleteCategory(id);
    }
    
    const handleDeleteSubCategoryLocal = (catId: string, subCatId: string) => {
        if(isSubCategoryInUse(subCatId)) {
            addNotification('This subcategory is in use. Please reassign transactions before deleting it.', 'error');
            return;
        }
        deleteSubCategory(catId, subCatId);
    }

    const handleExport = () => {
        const rows = categories.flatMap(cat => 
            cat.subcategories.length > 0
                ? cat.subcategories.map(sub => ({ Category: cat.name, Subcategory: sub.name }))
                : [{ Category: cat.name, Subcategory: '' }]
        );

        const csvContent = Papa.unparse(rows);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'categories_export.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addNotification('Categories exported successfully.', 'success');
    };
    
    const filteredCategories = useMemo(() => {
        if (!searchTerm) return categories;
        const lowercasedFilter = searchTerm.toLowerCase();
        return categories.filter(cat => 
            cat.name.toLowerCase().includes(lowercasedFilter) ||
            cat.subcategories.some(sub => sub.name.toLowerCase().includes(lowercasedFilter))
        );
    }, [categories, searchTerm]);

    const CategoryItem: React.FC<{category: Category, index: number}> = ({ category, index }) => {
        const [isExpanded, setIsExpanded] = useState(false);
        const [showAddForm, setShowAddForm] = useState(false);
        const [newSubCategoryName, setNewSubCategoryName] = useState('');
        const isEditingThis = editingCategory?.id === category.id;
        
        const handleAddSubCategory = () => {
            if (!newSubCategoryName.trim()) {
                addNotification("Subcategory name cannot be empty.", "error");
                return;
            }
            // Add with a default icon 'Tag'. The edit modal can change it.
            addSubCategory(category.id, { name: newSubCategoryName.trim() });
            setNewSubCategoryName('');
        };

        return (
            <div className={`rounded-lg transition-all ${isEditingThis ? 'bg-primary-50 dark:bg-primary-900/40 ring-2 ring-primary-500' : 'bg-gray-100 dark:bg-gray-800/50'}`}>
                <div className="p-2 flex items-center gap-2">
                    <div className="flex items-center gap-2 flex-grow cursor-pointer" onClick={() => handleSelectForEdit(category)}>
                         <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }}></span>
                         <DynamicIcon name={category.icon || 'Tag'} size={20} className="text-gray-700 dark:text-gray-200"/>
                         <span className="font-semibold">{category.name}</span>
                    </div>

                    <div className="flex items-center">
                        <button onClick={() => reorderCategory(category.id, 'up')} disabled={index === 0} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"><ArrowUp size={16}/></button>
                        <button onClick={() => reorderCategory(category.id, 'down')} disabled={index === categories.length - 1} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"><ArrowDown size={16}/></button>
                        <button onClick={() => handleDeleteCategory(category.id)} className="p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600"><Trash2 size={16}/></button>
                         <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                            <ChevronRight size={18} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                    </div>
                </div>
                {isExpanded && (
                    <div className="pl-12 pr-4 pb-3 space-y-2">
                        {category.subcategories.map(sub => (
                            <div key={sub.id} className="flex items-center gap-2 group">
                                <div className="flex items-center gap-2 flex-grow">
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{sub.name}</span>
                                </div>
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setSubCategoryModalState({ isOpen: true, categoryId: category.id, subCategoryToEdit: sub })} className="p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600"><Edit size={14}/></button>
                                    <button onClick={() => handleDeleteSubCategoryLocal(category.id, sub.id)} className="p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        ))}
                        
                        {showAddForm ? (
                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="text"
                                    value={newSubCategoryName}
                                    onChange={(e) => setNewSubCategoryName(e.target.value)}
                                    placeholder="New subcategory name..."
                                    className="form-input flex-grow text-sm py-1 px-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddSubCategory();
                                        }
                                        if (e.key === 'Escape') {
                                            setShowAddForm(false);
                                            setNewSubCategoryName('');
                                        }
                                    }}
                                />
                                <button type="button" onClick={handleAddSubCategory} className="p-2 rounded-md bg-green-100 dark:bg-green-900/50 text-green-600 hover:bg-green-200"><Check size={16} /></button>
                                <button type="button" onClick={() => setShowAddForm(false)} className="p-2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300"><X size={16} /></button>
                            </div>
                        ) : (
                             <button onClick={() => setShowAddForm(true)} className="text-sm flex items-center gap-1 text-primary-600 hover:underline pt-2">
                                <Plus size={14}/> Add Subcategory
                            </button>
                        )}
                    </div>
                )}
            </div>
        )
    }

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                        <h2 className="text-2xl font-bold">Manage Categories</h2>
                        <div className="flex items-center gap-2">
                            <button onClick={handleExport} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Export Categories"><Download size={20}/></button>
                            <button onClick={() => setImportModalOpen(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Import Categories"><Upload size={20}/></button>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Close"><X size={20} /></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 flex-grow overflow-hidden">
                        {/* Left Column - Category List */}
                        <div className="md:col-span-2 flex flex-col gap-4 overflow-hidden">
                            <div className="relative flex-shrink-0">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search categories..." className="form-input w-full pl-10 bg-white dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
                            </div>
                            <div className="flex-grow overflow-y-auto space-y-2 pr-2 -mr-2">
                                {filteredCategories.map((cat, index) => (
                                    <CategoryItem key={cat.id} category={cat} index={index} />
                                ))}
                                {filteredCategories.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">No categories match your search.</div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Add/Edit Panel */}
                        <div className="md:col-span-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 flex flex-col gap-4">
                            <h3 className="font-bold text-lg">{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={panelName}
                                    onChange={e => setPanelName(e.target.value)}
                                    placeholder="e.g. Household"
                                    className="form-input w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <ColorPicker value={panelColor} onChange={setPanelColor} />

                            <div className="mt-auto pt-4 flex flex-col gap-2">
                                <button onClick={handlePanelSubmit} className="w-full bg-primary-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-primary-700 flex items-center justify-center gap-2"><Save size={16}/> {editingCategory ? 'Save Changes' : 'Add Category'}</button>
                                {editingCategory && (
                                    <button onClick={clearPanel} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md font-semibold hover:bg-gray-100 dark:hover:bg-gray-600">Cancel Edit</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {isImportModalOpen && <CategoryImportModal onClose={() => setImportModalOpen(false)} />}
            {subCategoryModalState.isOpen && (
                <SubCategoryModal
                    onClose={() => setSubCategoryModalState({ isOpen: false })}
                    categoryId={subCategoryModalState.categoryId!}
                    subCategoryToEdit={subCategoryModalState.subCategoryToEdit}
                />
            )}
        </>
    );
};