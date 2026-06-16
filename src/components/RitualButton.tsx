import { type ButtonHTMLAttributes } from "react";

export function RitualButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return (
    <button
      {...rest}
      className={`ritual-button px-8 py-3 rounded-sm text-sm uppercase ${className}`}
    />
  );
}
