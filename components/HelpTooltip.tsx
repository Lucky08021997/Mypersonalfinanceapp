import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface HelpTooltipProps {
    text: string;
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({ text }) => {
    const [show, setShow] = useState(false);

    return (
        <div 
            className="relative inline-block" 
            onMouseEnter={() => setShow(true)} 
            onMouseLeave={() => setShow(false)}
        >
            <HelpCircle size={16} className="text-gray-400 dark:text-gray-500 cursor-help" />
            {show && (
                <div 
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 bg-gray-800 text-white text-xs rounded-lg py-2 px-3 z-10 shadow-lg animate-fade-in-up"
                >
                    {text}
                </div>
            )}
            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translate(-50%, 10px);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, 0);
                    }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default HelpTooltip;