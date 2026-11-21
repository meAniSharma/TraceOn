import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import Toast from '../components/layout/Toast.jsx';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ message: '', on: false });
  const timer = useRef();

  const showToast = useCallback((message) => {
    setToast({ message, on: true });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast((t) => ({ ...t, on: false })), 3000);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast message={toast.message} on={toast.on} />
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
