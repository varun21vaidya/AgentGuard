import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Auth from './components/common/Auth';
import { ToastProvider } from './components/common/Toast';
import './index.css';

function Root() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('agentguard_token')
  );

  if (!token) {
    return (
      <ToastProvider>
        <Auth onAuthenticated={setToken} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <App />
    </ToastProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
