import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Locate the single native HTML container element we declared in index.html
const container = document.getElementById('root');

if (!container) {
  throw new Error('Failed to find the root element. Application initialization aborted.');
}

// Instantiate the React Virtual DOM root and mount our parent component
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);