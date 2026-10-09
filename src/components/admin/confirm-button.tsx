"use client";

import { type ReactNode, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { ActionResult } from "@/lib/admin/auth";

/** A button that asks for confirmation, runs a server action and shows a toast. */
export function ConfirmButton({
  children,
  title,
  message,
  confirmLabel = "Confirm",
  danger,
  action,
  onDone,
  variant = "outline",
  size = "sm",
  className,
}: {
  children: ReactNode;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  action: () => Promise<ActionResult>;
  onDone?: (result: ActionResult) => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        {children}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              variant={danger ? "danger" : "primary"}
              loading={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await action();
                  if (result.ok) toast.success(result.message ?? "Done.");
                  else toast.error(result.message ?? "Something went wrong.");
                  setOpen(false);
                  onDone?.(result);
                })
              }
            >
              {confirmLabel}
            </Button>
          </div>
        }
      >
        <div className="p-5 text-sm text-gray-700">{message}</div>
      </Dialog>
    </>
  );
}
