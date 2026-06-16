import { type ButtonHTMLAttributes } from "react";

interface RitualButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  summoning?: boolean;
}

export function RitualButton(props: RitualButtonProps) {
  const { className = "", summoning = false, ...rest } = props;
  return (
    <button
      {...rest}
      className={`ritual-button px-8 py-3 rounded-sm text-sm uppercase ${summoning ? "summoning" : ""} ${className}`}
    />
  );
}
