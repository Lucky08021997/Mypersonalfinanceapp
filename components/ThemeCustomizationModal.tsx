import React from 'react';
import { X, Palette } from 'lucide-react';
import { useAppContext } from '../hooks/useAppContext';
import { ThemeConfig, ColorPalette, ThemeMode } from '../types';
import { PALETTES } from '../constants';

interface ThemeCustomizationModalProps {
    onClose: () => void;
}

const ThemeCustomizationModal: React.FC<ThemeCustomizationModalProps> = ({ onClose }) => {
    const { state, setTheme } = useAppContext();
    const { theme } = state;

    const handleModeChange = (mode: ThemeMode) => {
        setTheme({ ...theme, mode });
    };

    const handlePaletteChange = (palette: ColorPalette) => {
        setTheme({ ...theme, palette });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold flex items-center gap-2"><Palette size={24}/> Theme & Appearance</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X size={24} /></button>
                </div>

                <div className="p-6 space-y-6 flex-grow overflow-y-auto">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Color Mode</h3>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => handleModeChange('light')} 
                                className={`w-full p-4 rounded-lg border-2 ${theme.mode === 'light' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-gray-300 dark:border-gray-600'}`}
                            >
                                Light
                            </button>
                            <button 
                                onClick={() => handleModeChange('dark')} 
                                className={`w-full p-4 rounded-lg border-2 ${theme.mode === 'dark' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-gray-300 dark:border-gray-600'}`}
                            >
                                Dark
                            </button>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Color Palette</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {(Object.keys(PALETTES) as ColorPalette[]).map(paletteName => (
                                <button 
                                    key={paletteName}
                                    onClick={() => handlePaletteChange(paletteName)}
                                    className={`p-3 rounded-lg border-2 capitalize ${theme.palette === paletteName ? 'border-primary-500' : 'border-transparent'}`}
                                >
                                    <div className="w-full h-10 rounded-md mb-2" style={{ backgroundColor: PALETTES[paletteName]['500'] }}></div>
                                    {paletteName}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <button onClick={onClose} className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors">Done</button>
                </div>
            </div>
        </div>
    );
};

export default ThemeCustomizationModal;