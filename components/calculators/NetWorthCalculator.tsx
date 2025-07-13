import React, { useState, useMemo } from 'react';
import CalculatorWrapper from './CalculatorWrapper';
import { useCurrency } from '../../hooks/useCurrency';
import { Plus, Trash2 } from 'lucide-react';

type Item = { id: number; name: string; value: number; };

const NetWorthCalculator: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { formatCurrency } = useCurrency();
    const [assets, setAssets] = useState<Item[]>([{ id: 1, name: 'Savings Account', value: 500000 }]);
    const [liabilities, setLiabilities] = useState<Item[]>([{ id: 1, name: 'Credit Card Debt', value: 50000 }]);

    const handleItemChange = (type: 'asset' | 'liability', id: number, field: 'name' | 'value', fieldValue: string | number) => {
        const setter = type === 'asset' ? setAssets : setLiabilities;
        setter(prev => prev.map(item => item.id === id ? { ...item, [field]: fieldValue } : item));
    };
    
    const addItem = (type: 'asset' | 'liability') => {
        const setter = type === 'asset' ? setAssets : setLiabilities;
        setter(prev => [...prev, { id: Date.now(), name: '', value: 0 }]);
    };
    
    const removeItem = (type: 'asset' | 'liability', id: number) => {
        const setter = type === 'asset' ? setAssets : setLiabilities;
        setter(prev => prev.filter(item => item.id !== id));
    };

    const { totalAssets, totalLiabilities, netWorth } = useMemo(() => {
        const ta = assets.reduce((sum, item) => sum + Number(item.value), 0);
        const tl = liabilities.reduce((sum, item) => sum + Number(item.value), 0);
        return { totalAssets: ta, totalLiabilities: tl, netWorth: ta - tl };
    }, [assets, liabilities]);

    const ItemList: React.FC<{ type: 'asset' | 'liability' }> = ({ type }) => {
        const items = type === 'asset' ? assets : liabilities;
        return (
            <div>
                <h3 className={`text-xl font-bold mb-2 ${type === 'asset' ? 'text-green-600' : 'text-red-600'}`}>{type === 'asset' ? 'Assets' : 'Liabilities'}</h3>
                <div className="space-y-2">
                    {items.map(item => (
                        <div key={item.id} className="flex gap-2 items-center">
                            <input type="text" placeholder="Item Name" value={item.name} onChange={e => handleItemChange(type, item.id, 'name', e.target.value)} className="form-input flex-grow bg-white dark:bg-gray-700"/>
                            <input type="number" placeholder="Value" value={item.value} onChange={e => handleItemChange(type, item.id, 'value', Number(e.target.value))} className="form-input w-36 bg-white dark:bg-gray-700"/>
                            <button onClick={() => removeItem(type, item.id)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>
                <button onClick={() => addItem(type)} className="mt-2 flex items-center gap-1 text-sm text-primary-600 font-semibold hover:underline">
                    <Plus size={14}/> Add {type}
                </button>
                 <p className="text-right font-bold text-lg mt-2 text-gray-800 dark:text-gray-100">{formatCurrency(items.reduce((s, i) => s + i.value, 0))}</p>
            </div>
        );
    };

    return (
        <CalculatorWrapper title="Net Worth Calculator" onClose={onClose}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                <div className="space-y-6">
                    <ItemList type="asset" />
                    <ItemList type="liability" />
                </div>
                 <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg text-center flex flex-col justify-center space-y-8">
                     <div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Your Net Worth</h3>
                        <p className={`text-5xl font-extrabold my-2 ${netWorth >= 0 ? 'text-primary-600' : 'text-red-500'}`}>{formatCurrency(netWorth)}</p>
                    </div>
                 </div>
            </div>
        </CalculatorWrapper>
    );
};

export default NetWorthCalculator;
