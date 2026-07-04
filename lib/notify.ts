import { toast } from "sonner";

/**
 * Standardized staff-facing notifications (Track 1.5).
 *
 * Modules were calling `toast.success(...)` / `toast.error(...)` directly with
 * ad-hoc (or missing) durations. This helper fixes the *semantics* of each
 * category in one place so feedback reads consistently across the platform:
 *
 *   success — transient confirmation, dismisses quickly (3s)
 *   info    — neutral notice (4s)
 *   warning — needs a moment's attention, lingers (6s)
 *   error   — must not be missed, lingers longest (8s)
 *
 * Colour is already handled by <Toaster richColors />; this layer owns timing
 * and intent. Callers may still override any field (id, duration, description,
 * action) via the options argument.
 */

// Derive the options type from sonner itself so we stay compatible across
// versions without importing a named type that may be renamed upstream.
type NotifyOptions = Parameters<typeof toast.success>[1];

const DURATION = {
  success: 3000,
  info: 4000,
  warning: 6000,
  error: 8000
} as const;

function withDuration(category: keyof typeof DURATION, options?: NotifyOptions): NotifyOptions {
  return { duration: DURATION[category], ...options };
}

export const notify = {
  success(message: string, options?: NotifyOptions) {
    return toast.success(message, withDuration("success", options));
  },
  info(message: string, options?: NotifyOptions) {
    return toast.info(message, withDuration("info", options));
  },
  warning(message: string, options?: NotifyOptions) {
    return toast.warning(message, withDuration("warning", options));
  },
  error(message: string, options?: NotifyOptions) {
    return toast.error(message, withDuration("error", options));
  },
  /**
   * Brief, deduped confirmation for autosave-style writes — quieter than a
   * normal success so rapid edits don't stack a wall of toasts.
   */
  saved(message = "Saved", options?: NotifyOptions) {
    return toast.success(message, { duration: 1600, ...options });
  }
};
