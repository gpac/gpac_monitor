/**
 * Hook lifecycle function that runs before or after component logic
 * Returns true if successful, false otherwise
 */
export type HookFunction = () => Promise<boolean>;

/**
 * Hook lifecycle configuration
 */
export interface HookLifecycle {
  pre?: HookFunction;
  post?: HookFunction;
}
