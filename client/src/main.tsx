import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/geist/index.css';
import App from './app';

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
