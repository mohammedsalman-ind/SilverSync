export const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY || 'dummy-api-key',
  FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'silversync-demo.firebaseapp.com',
  FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'silversync-demo',
  FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'silversync-demo.appspot.com',
  FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:abcdef123456',
  USE_FIREBASE_EMULATOR: import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true',
};
