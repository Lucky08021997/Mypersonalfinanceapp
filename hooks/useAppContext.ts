
import { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import type { AppContextType } from '../types';

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};
