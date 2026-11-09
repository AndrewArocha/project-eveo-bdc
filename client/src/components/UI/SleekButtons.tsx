// src/components/UI/SleekButtons.tsx
import React from 'react';
import { playGalleryClick, playHover } from '../../utils/soundEngine';

type ButtonTone = 'neutral' | 'orange' | 'blue' | 'emerald' | 'red';

const TONE_STYLES: Record<ButtonTone, string> = {
  neutral:
    'bg-white/6 hover:bg-white/14 text-gray-200 hover:text-white border-white/12 hover:border-white/25 shadow-[inset_0_1px_3px_rgba(255,255,255,0.12)]',
  orange:
    'bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 hover:text-orange-300 border-orange-500/30 hover:border-orange-500/50 shadow-[inset_0_1px_3px_rgba(249,115,22,0.2)]',
  blue:
    'bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 hover:text-blue-300 border-blue-500/30 hover:border-blue-500/50 shadow-[inset_0_1px_3px_rgba(59,130,246,0.2)]',
  emerald:
    'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 hover:text-emerald-300 border-emerald-500/30 hover:border-emerald-500/50 shadow-[inset_0_1px_3px_rgba(16,185,129,0.2)]',
  red:
    'bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-red-300 border-red-500/30 hover:border-red-500/50 shadow-[inset_0_1px_3px_rgba(239,68,68,0.2)]',
};

interface SleekIconButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  tone?: ButtonTone;
  disabled?: boolean;
  className?: string;
}

export function SleekIconButton({
  icon,
  label,
  onClick,
  tone = 'neutral',
  disabled = false,
  className = '',
}: SleekIconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onMouseEnter={() => !disabled && playHover()}
      onClick={(e) => {
        if (disabled) return;
        playGalleryClick();
        onClick?.(e);
      }}
      className={`h-9 w-9 rounded-xl border backdrop-blur-xl flex items-center justify-center transition-all active:scale-90 outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 ${TONE_STYLES[tone]} ${className}`}
    >
      {icon}
    </button>
  );
}

interface SleekPillButtonProps {
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit';
  tone?: ButtonTone;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function SleekPillButton({
  icon,
  children,
  onClick,
  type = 'button',
  tone = 'neutral',
  disabled = false,
  size = 'sm',
  className = '',
}: SleekPillButtonProps) {
  const sizeStyles =
    size === 'sm'
      ? 'h-8 px-3 text-[11px] gap-1.5 rounded-xl'
      : 'h-10 px-4 text-xs gap-2 rounded-xl';

  return (
    <button
      type={type}
      disabled={disabled}
      onMouseEnter={() => !disabled && playHover()}
      onClick={(e) => {
        if (disabled) return;
        playGalleryClick();
        onClick?.(e);
      }}
      className={`inline-flex items-center justify-center border backdrop-blur-xl font-bold tracking-wide transition-all active:scale-95 outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 ${sizeStyles} ${TONE_STYLES[tone]} ${className}`}
    >
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      <span className="truncate">{children}</span>
    </button>
  );
}