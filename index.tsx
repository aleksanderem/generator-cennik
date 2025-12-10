import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './src/index.css';

// Inicjalizacja Convex
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

// Clerk publishable key
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Sprawdź czy klucze są skonfigurowane
if (!clerkPubKey || clerkPubKey === 'pk_test_TWOJ_KLUCZ_CLERK') {
  console.warn('⚠️ Clerk key not configured. Auth will be disabled.');

  // Renderuj bez auth (development mode)
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
} else {
  // Pełna wersja z auth
  root.render(
    <React.StrictMode>
      <ClerkProvider publishableKey={clerkPubKey}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </React.StrictMode>
  );
}
