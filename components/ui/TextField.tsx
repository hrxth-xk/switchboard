import { useId, type InputHTMLAttributes } from "react";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "placeholder"> & {
  label: string;
  error?: string;
};

export function TextField({ label, error, name, className, ...props }: TextFieldProps) {
  const generatedId = useId();
  const fieldId = name ? `field-${name}` : generatedId;

  return (
    <div className={`text-field${error ? " has-error" : ""}${className ? ` ${className}` : ""}`}>
      <div className="text-field-control">
        <input id={fieldId} name={name} placeholder=" " {...props} />
        <label className="text-field-label" htmlFor={fieldId}>
          {label}
        </label>
      </div>
      {error ? (
        <span className="text-field-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
