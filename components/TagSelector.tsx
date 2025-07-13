
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { getTagColor } from '../constants';
import { X, ChevronDown, PlusCircle } from 'lucide-react';

interface TagSelectorProps {
    selectedTags: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
}

const TagSelector: React.FC<TagSelectorProps> = ({ selectedTags, onChange, placeholder = "Add tags..." }) => {
    const { activeDashboardData } = useAppContext();
    const { transactions } = activeDashboardData;
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        transactions.forEach(t => t.tags?.forEach(tag => tagSet.add(tag)));
        return Array.from(tagSet).sort();
    }, [transactions]);
    
    const filteredTags = useMemo(() => {
        if (!searchTerm) {
            return allTags.filter(tag => !selectedTags.includes(tag));
        }
        return allTags.filter(tag => 
            tag.toLowerCase().includes(searchTerm.toLowerCase()) && !selectedTags.includes(tag)
        );
    }, [allTags, searchTerm, selectedTags]);

    const handleAddTag = (tag: string) => {
        const newTag = tag.trim().toLowerCase();
        if (newTag && !selectedTags.includes(newTag)) {
            onChange([...selectedTags, newTag]);
        }
        setSearchTerm('');
        setIsOpen(true);
    };

    const handleRemoveTag = (tagToRemove: string) => {
        onChange(selectedTags.filter(tag => tag !== tagToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchTerm.trim()) {
            e.preventDefault();
            handleAddTag(searchTerm);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const canAddNew = searchTerm.trim() && !allTags.some(t => t.toLowerCase() === searchTerm.trim().toLowerCase());

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div 
                className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 cursor-text min-h-[42px]"
                onClick={() => wrapperRef.current?.querySelector('input')?.focus()}
            >
                {selectedTags.map(tag => {
                    const color = getTagColor(tag);
                    return (
                        <span key={tag} className={`flex items-center gap-1 ${color.bg} ${color.text} text-sm font-medium px-2 py-1 rounded-full`}>
                            {tag}
                            <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveTag(tag); }} className={`ml-1 ${color.text} opacity-70 hover:opacity-100`}>
                                <X size={14} />
                            </button>
                        </span>
                    )
                })}
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); }}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedTags.length > 0 ? '' : placeholder}
                    className="flex-grow bg-transparent focus:outline-none text-sm p-1 min-w-[100px]"
                    onFocus={() => setIsOpen(true)}
                />
                 <button type="button" onClick={() => setIsOpen(!isOpen)} className="p-1">
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                 </button>
            </div>

            {isOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {canAddNew && (
                        <div 
                            className="px-3 py-2 cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/40 flex items-center gap-2"
                            onClick={() => handleAddTag(searchTerm)}
                        >
                            <PlusCircle size={16} className="text-primary-600"/>
                            <span>Create new tag: <span className="font-bold">"{searchTerm}"</span></span>
                        </div>
                    )}
                    {filteredTags.map(tag => {
                        const color = getTagColor(tag);
                        return (
                             <div 
                                key={tag} 
                                className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center"
                                onClick={() => handleAddTag(tag)}
                             >
                                <span className={`text-sm ${color.bg} ${color.text} px-2 py-0.5 rounded-full`}>{tag}</span>
                            </div>
                        )
                    })}
                     {filteredTags.length === 0 && !canAddNew && (
                        <div className="px-3 py-2 text-sm text-gray-500">No tags found.</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TagSelector;
