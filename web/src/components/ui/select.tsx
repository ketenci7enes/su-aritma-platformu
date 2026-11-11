"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, className, id, children, ...props },
  ref,
) {
  const generatedId = React.useId();
  const selectId = id ?? generatedId;
  const errorId = `${selectId}-error`;

  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-ink">
        {label}
        {props.required ? (
          <span aria-hidden="true" className="ml-1 text-danger">
            *
          </span>
        ) : null}
      </label>
      <select
        ref={ref}
        id={selectId}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "h-11 w-full appearance-none rounded-xl border border-border-soft bg-surface px-3.5 text-sm text-ink",
          "focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
          error && "border-danger",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {hint && !error ? <p className="text-xs text-ink-soft">{hint}</p> : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
});
