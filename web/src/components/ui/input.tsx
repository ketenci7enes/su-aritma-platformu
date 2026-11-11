"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, id, ...props },
  ref,
) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {label}
        {props.required ? (
          <span aria-hidden="true" className="ml-1 text-danger">
            *
          </span>
        ) : null}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={cn(error && errorId, hint && hintId) || undefined}
        className={cn(
          "h-11 w-full rounded-xl border border-border-soft bg-surface px-3.5 text-sm text-ink",
          "transition-colors placeholder:text-ink-soft/70",
          "focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
          error && "border-danger focus-visible:outline-danger",
          "disabled:cursor-not-allowed disabled:bg-surface-muted",
          className,
        )}
        {...props}
      />
      {hint && !error ? (
        <p id={hintId} className="text-xs text-ink-soft">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
});
