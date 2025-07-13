import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import type { Notification as NotificationType } from '../types';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const icons = {
  success: <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />,
  error: <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />,
  info: <Info className="h-5 w-5 text-blue-400" aria-hidden="true" />,
};

const Notification: React.FC<{ notification: NotificationType, onDismiss: (id: number) => void }> = ({ notification, onDismiss }) => {
  const { id, message, type, action } = notification;

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden w-full max-w-sm">
      <div className="p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {icons[type]}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex items-center space-x-3">
            {action && (
               <button
                  onClick={action.onClick}
                  className="bg-transparent border-none text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline focus:outline-none whitespace-nowrap"
                >
                  {action.label}
                </button>
            )}
            <button
              className="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-primary-500"
              onClick={() => onDismiss(id)}
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


const NotificationContainer: React.FC = () => {
    const { state, removeNotification } = useAppContext();

    if (!state.notifications.length) {
        return null;
    }

    return (
        <div
            aria-live="assertive"
            className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-[100]"
        >
            <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
                {state.notifications.map((notification) => (
                    <Notification key={notification.id} notification={notification} onDismiss={removeNotification} />
                ))}
            </div>
        </div>
    );
};

export default NotificationContainer;