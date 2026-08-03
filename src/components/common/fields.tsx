import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  children,
  className,
  hint,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="label-caps">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint ? <span className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

const baseInput =
  "h-10 w-full rounded-lg border px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-editable";

export function TextInput({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(baseInput, "field-editable num", className)} {...rest} />;
}

export function TextArea({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(baseInput, "field-editable h-auto min-h-24 py-2", className)}
      {...rest}
    />
  );
}

export function SelectInput({
  options,
  className,
  placeholder,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: { value: string; label: string }[] | string[];
  placeholder?: string;
}) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <select className={cn(baseInput, "field-editable", className)} {...rest}>
      {placeholder ? <option value="">{placeholder}</option> : null}
      {opts.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Campo calculado: somente leitura, discreto. */
export function Computed({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "num flex h-10 items-center rounded-lg border border-transparent bg-muted/60 px-3 text-sm text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}