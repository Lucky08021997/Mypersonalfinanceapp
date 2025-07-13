import React from 'react';
import HelpTooltip from './HelpTooltip';

interface WidgetCardProps {
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
    helpText?: string;
}

const WidgetCard: React.FC<WidgetCardProps> = ({ title, children, actions, className = '', helpText }) => {
    return (
        <div className={`bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg flex flex-col ${className}`}>
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{title}</h3>
                    {helpText && <HelpTooltip text={helpText} />}
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
            <div className="flex-grow flex flex-col justify-center">
                {children}
            </div>
        </div>
    );
};

export default WidgetCard;