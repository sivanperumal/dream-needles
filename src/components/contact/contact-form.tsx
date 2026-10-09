"use client";

import {
  ArrowRight,
  AtSign,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  Shapes,
  UserRound,
} from "lucide-react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/input";
import { type ContactState, submitContact } from "@/lib/actions/contact";
import { cn } from "@/lib/utils";
import { CONTACT_TOPICS } from "@/lib/validation/contact";

const field =
  "w-full rounded-lg bg-[#f0f3ff] py-3 pr-3 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-brand/20 focus:outline-none aria-invalid:ring-2 aria-invalid:ring-rose-300";

/** "Send Us a Message" form (Figma 93:3996). */
export function ContactForm({
  defaultName = "",
  defaultEmail = "",
}: {
  defaultName?: string;
  defaultEmail?: string;
}) {
  const [state, action, pending] = useActionState<ContactState, FormData>(
    submitContact,
    null,
  );
  const [message, setMessage] = useState("");
  const errors = state?.errors ?? {};

  if (state?.ok) {
    return (
      <div
        className="flex flex-col items-center py-10 text-center"
        role="status"
      >
        <CheckCircle2 className="size-12 text-emerald-500" aria-hidden="true" />
        <p className="mt-4 text-lg font-semibold text-gray-900">
          {state.message}
        </p>
      </div>
    );
  }

  const label = (htmlFor: string, text: string, required = true) => (
    <label
      htmlFor={htmlFor}
      className="mb-2 flex justify-between text-xs font-semibold tracking-wide text-gray-800 uppercase"
    >
      {text}
      {required && (
        <span className="text-rose-500" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );

  return (
    <form action={action} className="grid gap-5 md:grid-cols-2" noValidate>
      {/* Honeypot: invisible to people. */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div>
        {label("contact-name", "Full name")}
        <div className="relative">
          <UserRound
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-500"
            aria-hidden="true"
          />
          <input
            id="contact-name"
            name="name"
            autoComplete="name"
            defaultValue={defaultName}
            placeholder="Your name"
            className={field}
            aria-invalid={errors.name ? true : undefined}
            required
          />
        </div>
        <FieldError>{errors.name}</FieldError>
      </div>
      <div>
        {label("contact-email", "Email address")}
        <div className="relative">
          <AtSign
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-500"
            aria-hidden="true"
          />
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={defaultEmail}
            placeholder="you@example.com"
            className={field}
            aria-invalid={errors.email ? true : undefined}
            required
          />
        </div>
        <FieldError>{errors.email}</FieldError>
      </div>
      <div className="md:col-span-2">
        {label("contact-subject", "Inquiry topic")}
        <div className="relative">
          <Shapes
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-500"
            aria-hidden="true"
          />
          <select
            id="contact-subject"
            name="subject"
            defaultValue=""
            className={cn(field, "appearance-none")}
            aria-invalid={errors.subject ? true : undefined}
            required
          >
            <option value="" disabled>
              Select how we can assist you…
            </option>
            {CONTACT_TOPICS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-gray-500"
            aria-hidden="true"
          />
        </div>
        <FieldError>{errors.subject}</FieldError>
      </div>
      <div className="md:col-span-2">
        <label
          htmlFor="contact-phone"
          className="mb-2 block text-xs font-semibold tracking-wide text-gray-800 uppercase"
        >
          Mobile number{" "}
          <span className="font-normal text-gray-500 normal-case">
            (optional)
          </span>
        </label>
        <input
          id="contact-phone"
          name="phone"
          inputMode="tel"
          autoComplete="tel"
          className={cn(field, "pl-3")}
        />
      </div>
      <div className="md:col-span-2">
        <label
          htmlFor="contact-message"
          className="mb-2 flex justify-between text-xs font-semibold tracking-wide text-gray-800 uppercase"
        >
          Your message{" "}
          <span className="font-normal text-gray-500">
            {message.length} / 500
          </span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          maxLength={500}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us how we can help with your craft journey…"
          className={cn(field, "pl-4")}
          aria-invalid={errors.message ? true : undefined}
          required
        />
        <FieldError>{errors.message}</FieldError>
      </div>
      {state?.message && !state.ok && (
        <p className="text-sm text-rose-600 md:col-span-2" role="alert">
          {state.message}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4 md:col-span-2">
        <p className="flex items-center gap-1.5 text-sm text-gray-600">
          <BadgeCheck className="size-4" aria-hidden="true" /> Typically
          responds within 24 hours on working days.
        </p>
        <Button
          type="submit"
          size="lg"
          loading={pending}
          className="rounded-full"
        >
          Send Message <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </form>
  );
}
