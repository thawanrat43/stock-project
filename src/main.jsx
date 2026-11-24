import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('ไม่พบ element #root สำหรับแสดงผล React');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
