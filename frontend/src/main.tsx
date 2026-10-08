import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/i18n';
import '@/styles/index.css';
import { App } from '@/app/App';
import { config } from '@/config';
import { applyColorScheme } from '@/lib/colorScheme';

applyColorScheme();

// Routes the backend does not have yet are answered in the browser (src/demo).
if (config.demoFeatures.size > 0) {
  const { installDemoServer } = await import('@/demo');
  installDemoServer(config.demoFeatures);
}

const container = document.getElementById('root');
if (!container) throw new Error('index.html must contain <div id="root">');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
