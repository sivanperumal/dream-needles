import type { ComponentProps, ReactNode } from "react";
import { FieldError } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const control =
  "block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15 focus:outline-none aria-invalid:border-rose-400";

type Base = {
  label: string;
  name: string;
  error?: string;
  hint?: ReactNode;
  className?: string;
};

export function TextField({
  label,
  name,
  error,
  hint,
  className,
  ...props
}: Base & ComponentProps<"input">) {
  return (
    <div className={className}>
      <label
        htmlFor={`f-${name}`}
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <input
        id={`f-${name}`}
        name={name}
        aria-invalid={error ? true : undefined}
        className={control}
        {...props}
      />
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      <FieldError>{error}</FieldError>
    </div>
  );
}

export function TextArea({
  label,
  name,
  error,
  hint,
  className,
  ...props
}: Base & ComponentProps<"textarea">) {
  return (
    <div className={className}>
      <label
        htmlFor={`f-${name}`}
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <textarea
        id={`f-${name}`}
        name={name}
        aria-invalid={error ? true : undefined}
        className={cn(control, "min-h-24")}
        {...props}
      />
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      <FieldError>{error}</FieldError>
    </div>
  );
}

export function SelectField({
  label,
  name,
  error,
  hint,
  className,
  options,
  ...props
}: Base &
  ComponentProps<"select"> & { options: { value: string; label: string }[] }) {
  return (
    <div className={className}>
      <label
        htmlFor={`f-${name}`}
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <select
        id={`f-${name}`}
        name={name}
        aria-invalid={error ? true : undefined}
        className={control}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      <FieldError>{error}</FieldError>
    </div>
  );
}

export function CheckboxField({
  label,
  name,
  hint,
  ...props
}: { label: string; name: string; hint?: string } & ComponentProps<"input">) {
  return (
    <label className="flex items-start gap-2.5 text-sm text-gray-700">
      <input
        type="checkbox"
        name={name}
        className="mt-0.5 size-4 accent-brand"
        {...props}
      />
      <span>
        {label}
        {hint && <span className="block text-xs text-gray-500">{hint}</span>}
      </span>
    </label>
  );
}
