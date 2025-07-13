import { useCallback } from 'react';
import { useAppContext } from './useAppContext';

export const useCurrency = () => {
    const { state } = useAppContext();
    
    const formatCurrency = useCallback((value: number) => {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: state.currency,
        }).format(value);
    }, [state.currency]);

    return {
        currency: state.currency,
        formatCurrency,
    };
};
