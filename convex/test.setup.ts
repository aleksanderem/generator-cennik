/// <reference types="vite/client" />

// Eksportuj wszystkie moduły Convex dla testów
// Ten glob pattern zawiera wszystkie pliki .ts/.js w katalogu convex
// z wyjątkiem plików z wieloma rozszerzeniami (np. .test.ts, .d.ts)
export const modules = import.meta.glob("./**/!(*.*.*)*.*s");
