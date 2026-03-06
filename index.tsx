
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import './index.css';
import App from './App';
import { installChunkRecovery } from './utils/chunkRecovery';
import { ThemeProvider } from './services/ThemeContext';

installChunkRecovery();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);


if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SYNC_FEEDBACK_QUEUE') {
      void import('./services/ai/feedback/feedbackService').then(({ flushQueuedFeedback }) => flushQueuedFeedback());
    }
    if (event.data?.type === 'SYNC_AI_GENERATION_FEEDBACK_QUEUE') {
      void import('./services/ai/feedback/aiGenerationFeedbackService').then(({ flushAIGenerationFeedbackQueue }) => flushAIGenerationFeedbackQueue());
    }
  });

  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration.scope);
        })
        .catch((error) => {
          console.log('SW registration failed:', error);
        });
    });
  } else {
    // Dev: prevent stale cached bundles/pages from masking local changes.
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        void registration.unregister();
      });
    });
    if (typeof caches !== 'undefined') {
      void caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          if (cacheName.startsWith('personalpro-')) {
            void caches.delete(cacheName);
          }
        });
      });
    }
  }
}
