"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/admin/auth";

/** Runs a form server action, toasts the result and refreshes server data on success. */
export function useAdminForm(
  action: (
    prev: ActionResult | null,
    formData: FormData,
  ) => Promise<ActionResult>,
  onSuccess?: (result: ActionResult) => void,
) {
  const router = useRouter();
  return useActionState(
    async (prev: ActionResult | null, formData: FormData) => {
      const result = await action(prev, formData);
      if (result.ok) {
        toast.success(result.message ?? "Saved.");
        onSuccess?.(result);
        router.refresh();
      } else if (result.message) {
        toast.error(result.message);
      }
      return result;
    },
    null,
  );
}
