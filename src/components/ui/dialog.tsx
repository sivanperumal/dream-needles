"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { IconButton } from "./button";

type Placement = "center" | "right" | "left" | "full";

const placements: Record<Placement, string> = {
  center: "m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg rounded-2xl",
  right: "my-0 mr-0 ml-auto h-dvh max-h-dvh w-full max-w-md",
  left: "my-0 mr-auto ml-0 h-dvh max-h-dvh w-80 max-w-[85vw]",
  full: "m-0 h-dvh max-h-dvh w-screen max-w-none",
};

type DialogProps = {
  open: boolean;
  onClose: () => void;
  /** Accessible name; also rendered as the heading unless `hideTitle`. */
  title: string;
  hideTitle?: boolean;
  placement?: Placement;
  className?: string;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Modal built on the native <dialog>: focus trapping, Esc to close and the
 * backdrop come from the browser. Also used for side drawers (cart, mobile
 * menu) via `placement`.
 */
export function Dialog({
  open,
  onClose,
  title,
  hideTitle,
  placement = "center",
  className,
  children,
  footer,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Lock page scroll while open.
  useEffect(() => {
    if (!open) return;
    const { overflow } = document.documentElement.style;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = overflow;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // Clicking the backdrop targets the <dialog> element itself.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "bg-white p-0 text-gray-700 shadow-xl open:flex open:flex-col",
        placements[placement],
        className,
      )}
    >
      {open && (
        <>
          <div
            className={cn(
              "flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4",
              hideTitle && "sr-only",
            )}
          >
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <IconButton aria-label="Close" onClick={onClose} className="-mr-2">
              <X className="size-5" />
            </IconButton>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          {footer && (
            <div className="border-t border-gray-100 px-5 py-4">{footer}</div>
          )}
        </>
      )}
    </dialog>
  );
}
