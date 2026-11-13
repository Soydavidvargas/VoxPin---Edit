import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { reportWebVitals } from './utils/webVitals.ts';

createRoot(document.getElementById('root')!).render(<App />);

// Monitoreo de rendimiento en tiempo real (RUM) para celulares y conexiones lentas
reportWebVitals();
