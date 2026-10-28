/// <reference types="expo/types" />

/**
 * CSS is imported for its side effects by the web target. Metro handles the
 * asset; TypeScript only needs to know that the import is intentional.
 */
declare module '*.css';
