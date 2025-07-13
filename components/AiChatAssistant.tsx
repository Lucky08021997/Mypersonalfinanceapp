import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { getAiChatResponse } from '../lib/gemini';
import { Sparkles, Send, User, Bot, X, Trash2 } from 'lucide-react';

interface AiChatAssistantProps {
  onClose: () => void;
}

type Message = {
    sender: 'user' | 'ai';
    text: string;
    timestamp: string;
};

const AiChatAssistant: React.FC<AiChatAssistantProps> = ({ onClose }) => {
    const { state, isReady } = useAppContext();
    const [messages, setMessages] = useState<Message[]>([
        { 
            sender: 'ai', 
            text: "Hello! I'm your AI financial assistant. Ask me anything about your finances, like 'How much did I spend on food last month?' or 'Summarize my credit card debt'.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);
    
    const handleSend = async () => {
        if (!input.trim() || isLoading || !isReady) return;
        
        const userMessage: Message = { 
            sender: 'user', 
            text: input,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const aiResponse = await getAiChatResponse(input, { personal: state.personal, home: state.home }, state.currency);
            const aiMessage: Message = { 
                sender: 'ai', 
                text: aiResponse,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error(error);
            const errorMessage: Message = { 
                sender: 'ai', 
                text: "Sorry, I'm having trouble connecting right now. Please try again later.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    const handleClearHistory = () => {
        setMessages([
            { 
                sender: 'ai', 
                text: "Hello! I'm your AI financial assistant. How can I help you today?",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        ]);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-primary-600 dark:text-primary-400"><Sparkles /> AI Assistant</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={handleClearHistory} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Clear History">
                            <Trash2 size={18} />
                        </button>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Close">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-grow p-6 overflow-y-auto space-y-6">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                            {msg.sender === 'ai' && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center">
                                    <Bot size={18} />
                                </div>
                            )}
                            <div className={`max-w-md rounded-2xl ${msg.sender === 'ai' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-primary-500 text-white'}`}>
                               <p className="p-4 whitespace-pre-wrap">{msg.text}</p>
                               <p className={`text-xs px-3 pb-2 opacity-70 ${msg.sender === 'user' ? 'text-right text-primary-200' : 'text-left text-gray-500'}`}>{msg.timestamp}</p>
                            </div>
                             {msg.sender === 'user' && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-200 flex items-center justify-center">
                                    <User size={18} />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center">
                                <Bot size={18} />
                            </div>
                            <div className="max-w-md p-4 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center gap-2">
                                 <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse delay-75"></div>
                                 <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse delay-150"></div>
                                 <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse delay-300"></div>
                            </div>
                        </div>
                    )}
                     <div ref={messagesEndRef} />
                </div>
                <div className="p-4 bg-white/80 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <div className="relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask a question about your finances..."
                            disabled={isLoading || !isReady}
                            rows={1}
                            className="w-full form-textarea p-3 pr-20 rounded-xl bg-gray-100 dark:bg-gray-700 border-transparent focus:border-primary-500 focus:ring-primary-500 resize-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <span className="text-xs text-gray-400">
                               <kbd className="font-sans">↵</kbd>
                            </span>
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim() || !isReady}
                                className="p-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed transition-colors"
                                aria-label="Send message"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiChatAssistant;