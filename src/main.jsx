import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
// Import i18n before App so translations are ready when components mount
import './i18n/i18n.js';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
