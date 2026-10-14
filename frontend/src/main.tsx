import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/i18n';
import '@/styles/index.css';
import { App } from '@/app/App';
import { applyColorScheme } from '@/lib/colorScheme';
import '@/features/backdrop/register';

applyColorScheme();

const container = document.getElementById('root');
if (!container) throw new Error('index.html must contain <div id="root">');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
