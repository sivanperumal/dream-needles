"use client";

import { ArrowRight, Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/input";
import {
  type AuthState,
  sendLoginCode,
  verifyLoginCode,
} from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

/** Step 1: email (Figma 64:3). `inline` keeps the user on the same page (checkout). */
export function EmailForm({
  next,
  inline,
  onSent,
  defaultEmail = "",
}: {
  next: string;
  inline?: boolean;
  onSent?: (email: string) => void;
  defaultEmail?: string;
}) {
  const [state, action, pending] = useActionState(
    async (prev: AuthState, formData: FormData) => {
      const result = await sendLoginCode(prev, formData);
      if (result?.sent && result.email) onSent?.(result.email);
      return result;
    },
    null,
  );

  return (
    <form action={action} noValidate>
      <input type="hidden" name="next" value={next} />
      {inline && <input type="hidden" name="inline" value="1" />}
      <label
        htmlFor="login-email"
        className="text-xs font-semibold tracking-[0.6px] text-gray-700 uppercase"
      >
        Email address
      </label>
      <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-1.5 pl-4 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15">
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={defaultEmail}
          placeholder="you@example.com"
          aria-invalid={state?.error ? true : undefined}
          aria-describedby="login-email-error"
          className="w-full bg-transparent py-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="Continue"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand text-white hover:bg-brand-hover disabled:opacity-60"
        >
          <ArrowRight className="size-4" />
        </button>
      </div>
      <FieldError id="login-email-error">{state?.error}</FieldError>
      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={pending}
        className="mt-6 rounded-xl"
      >
        Continue with Email{" "}
        <ChevronRight className="size-4" aria-hidden="true" />
      </Button>
      <p className="mt-3 text-center text-xs text-gray-500">
        We&apos;ll email you a 6-digit code. No password needed.
      </p>
    </form>
  );
}

const RESEND_SECONDS = 60;

/** Step 2: 6-digit code with paste support, auto-submit and resend timer (Figma 65:125). */
export function CodeForm({
  email,
  next,
  onChangeEmail,
}: {
  email: string;
  next: string;
  onChangeEmail?: () => void;
}) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(
    async (prev: AuthState, formData: FormData) => {
      const result = await verifyLoginCode(prev, formData);
      // Clear the boxes after a wrong code so it can be retyped.
      if (result?.error) {
        setDigits(Array(6).fill(""));
        inputs.current[0]?.focus();
      }
      return result;
    },
    null,
  );
  const [resendState, resendAction, resending] = useActionState(
    async (prev: AuthState, formData: FormData) => {
      const result = await sendLoginCode(prev, formData);
      if (result?.sent) setSeconds(RESEND_SECONDS);
      return result;
    },
    null,
  );
  const code = digits.join("");

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  useEffect(() => inputs.current[0]?.focus(), []);

  const fill = (start: number, value: string) => {
    const chars = value
      .replace(/\D/g, "")
      .slice(0, 6 - start)
      .split("");
    if (!chars.length) return;
    const next = [...digits];
    chars.forEach((c, i) => (next[start + i] = c));
    setDigits(next);
    const focusAt = Math.min(start + chars.length, 5);
    inputs.current[focusAt]?.focus();
    if (next.every(Boolean))
      setTimeout(() => formRef.current?.requestSubmit(), 0);
  };

  return (
    <div>
      <form ref={formRef} action={action}>
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="code" value={code} />
        <fieldset>
          <legend className="sr-only">6-digit verification code</legend>
          <div className="flex justify-between gap-2">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                value={d}
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                maxLength={6}
                aria-label={`Digit ${i + 1}`}
                aria-invalid={state?.error ? true : undefined}
                onChange={(e) => {
                  if (!e.target.value) {
                    const nextDigits = [...digits];
                    nextDigits[i] = "";
                    setDigits(nextDigits);
                  } else fill(i, e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !digits[i] && i > 0)
                    inputs.current[i - 1]?.focus();
                  if (e.key === "ArrowLeft" && i > 0)
                    inputs.current[i - 1]?.focus();
                  if (e.key === "ArrowRight" && i < 5)
                    inputs.current[i + 1]?.focus();
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  fill(i, e.clipboardData.getData("text"));
                }}
                className={cn(
                  "size-12 rounded-xl border-2 text-center text-xl font-semibold text-gray-900 focus:border-brand focus:outline-none md:size-[52px]",
                  d ? "border-brand" : "border-gray-200",
                  state?.error && "border-rose-400",
                )}
              />
            ))}
          </div>
        </fieldset>
        <FieldError>{state?.error}</FieldError>
        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={pending}
          disabled={code.length < 6}
          className="mt-6 rounded-xl"
        >
          Verify &amp; Continue <Check className="size-4" aria-hidden="true" />
        </Button>
      </form>

      <form
        action={resendAction}
        className="mt-4 text-center text-sm text-gray-600"
      >
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="resend" value="1" />
        {seconds > 0 ? (
          <p aria-live="polite">
            Resend code in{" "}
            <span className="font-semibold text-gray-900">
              0:{String(seconds).padStart(2, "0")}
            </span>
          </p>
        ) : (
          <button
            type="submit"
            disabled={resending}
            className="font-semibold text-brand hover:underline disabled:opacity-60"
          >
            {resending ? "Sending…" : "Resend code"}
          </button>
        )}
        {resendState?.sent && seconds > RESEND_SECONDS - 5 && (
          <p className="mt-1 text-emerald-700">A new code is on its way.</p>
        )}
        {resendState?.error && (
          <p className="mt-1 text-rose-600">{resendState.error}</p>
        )}
      </form>

      {onChangeEmail ? (
        <button
          type="button"
          onClick={onChangeEmail}
          className="mt-2 w-full text-center text-sm font-medium text-brand hover:underline"
        >
          Use a different email
        </button>
      ) : null}
    </div>
  );
}

export function ChangeEmailLink({ next }: { next: string }) {
  return (
    <Link
      href={`/login?next=${encodeURIComponent(next)}`}
      className="text-sm font-medium text-brand hover:underline"
    >
      Change email
    </Link>
  );
}
