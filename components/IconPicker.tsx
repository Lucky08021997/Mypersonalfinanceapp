import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as icons from 'lucide-react';

const DynamicIcon = ({ name, ...props }: { name: string; [key: string]: any }) => {
    const LucideIcon = (icons as any)[name] || icons.Tag;
    return <LucideIcon {...props} />;
};

const iconList = Object.keys(icons).filter(key => /^[A-Z]/.test(key) && key !== 'createReactComponent' && key !== 'icons');

interface IconPickerProps {
    value: string;
    onChange: (icon: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const pickerRef = useRef<HTMLDivElement>(null);

    const filteredIcons = useMemo(() => {
        if (!searchTerm) return iconList;
        return iconList.filter(icon => icon.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectIcon = (icon: string) => {
        onChange(icon);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={pickerRef}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">
                <DynamicIcon name={value} size={20} className="text-gray-700 dark:text-gray-200" />
            </button>
            {isOpen && (
                <div className="absolute z-20 mt-1 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                        <input
                            type="text"
                            placeholder="Search icons..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full form-input text-sm"
                            autoFocus
                        />
                    </div>
                    <div className="grid grid-cols-6 gap-2 p-2 max-h-60 overflow-y-auto">
                        {filteredIcons.map(icon => (
                            <button
                                key={icon}
                                type="button"
                                title={icon}
                                onClick={() => handleSelectIcon(icon)}
                                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                            >
                                <DynamicIcon name={icon} size={20} />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
