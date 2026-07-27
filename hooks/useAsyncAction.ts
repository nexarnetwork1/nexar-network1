"use client";

import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

type UseAsyncActionOptions<T> = {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  successMessage?: string;
  errorMessage?: string;
};

/**
 * Wraps server actions with loading state and optional toast feedback.
 * Use with React Hook Form submit handlers.
 */
export function useAsyncAction<TInput, TOutput>(
  action: (input: TInput) => Promise<ActionResult<TOutput>>,
  options?: UseAsyncActionOptions<TOutput>
) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    (input: TInput) => {
      setError(null);
      startTransition(async () => {
        const result = await action(input);
        if (result.success) {
          options?.onSuccess?.(result.data);
          if (options?.successMessage) {
            toast.success(options.successMessage);
          }
        } else {
          setError(result.error);
          options?.onError?.(result.error);
          toast.error(options?.errorMessage ?? result.error);
        }
      });
    },
    [action, options]
  );

  return { execute, isPending, error };
}
