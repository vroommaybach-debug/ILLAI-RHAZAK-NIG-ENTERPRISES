import React, { useState } from 'react';
import { Laptop, Monitor, Printer, ScanLine } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'signal' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-4 py-2 text-xs font-semibold',
    md: 'px-6 py-3 text-sm font-semibold',
    lg: 'px-7 py-4 text-[15px] font-semibold',
  }[size];

  const variantClasses = {
    primary: 'btn btn-primary',
    ghost: 'btn btn-ghost',
    signal:
      'inline-flex items-center justify-center gap-2 rounded-full bg-[#ef2b3a] text-white hover:opacity-90 border border-transparent cursor-pointer',
    gold:
      'inline-flex items-center justify-center gap-2 rounded-full bg-[#f5b93a] text-[#05070d] font-bold hover:opacity-90 border border-transparent cursor-pointer',
  }[variant];

  return (
    <button
      className={`${variantClasses} ${sizeClasses} disabled:opacity-50 disabled:pointer-events-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Eyebrow: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`eyebrow ${className}`}>{children}</div>
);

export const Tag: React.FC<{
  children: React.ReactNode;
  tone?: 'default' | 'gold' | 'blue' | 'red';
  className?: string;
}> = ({ children, tone = 'default', className = '' }) => {
  const toneClass = {
    default: 'text-[#9aa3b8]',
    gold: 'text-[#f5b93a]',
    blue: 'text-[#38bdf8]',
    red: 'text-[#ef2b3a]',
  }[tone];

  return (
    <span
      className={`inline-flex items-center text-xs font-semibold tracking-wider uppercase ${toneClass} ${className}`}
    >
      {children}
    </span>
  );
};

export const Section: React.FC<{
  children: React.ReactNode;
  id?: string;
  className?: string;
  containerClassName?: string;
}> = ({ children, id, className = '', containerClassName = '' }) => (
  <section id={id} className={`pt-28 pb-20 relative ${className}`}>
    <div className={`wrap ${containerClassName}`}>{children}</div>
  </section>
);

export const Card: React.FC<{
  children: React.ReactNode;
  elevated?: boolean;
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
}> = ({
  children,
  elevated = false,
  interactive = false,
  className = '',
  onClick,
}) => (
  <div
    onClick={onClick}
    className={`${
      elevated ? 'ir-card-elevated' : 'ir-card-surface'
    } p-6 transition-transform duration-200 ${
      interactive
        ? 'hover:-translate-y-1 hover:border-[#2563ff66] cursor-pointer'
        : ''
    } ${className}`}
  >
    {children}
  </div>
);

export const GrainOverlay: React.FC = () => (
  <div aria-hidden="true" className="grain" />
);

export const GemMark: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = () => (
  <span aria-hidden="true" className="gem" />
);

export const Marquee: React.FC<{ items: string[] }> = ({ items }) => {
  const doubled = [...items, ...items];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="track">
        {doubled.map((item, idx) => (
          <React.Fragment key={`${item}-${idx}`}>
            <span>{item}</span>
            <i>&bull;</i>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export const ProductImageStage: React.FC<{
  src?: string;
  alt: string;
  categoryId?: string;
  isPlaceholder?: boolean;
  className?: string;
}> = ({ src, alt, categoryId = 'laptops', className = '' }) => {
  const [failed, setFailed] = useState(false);

  const CategoryIcon =
    categoryId === 'desktops'
      ? Monitor
      : categoryId === 'printers'
      ? Printer
      : categoryId === 'scanners'
      ? ScanLine
      : Laptop;

  return (
    <div
      className={`relative overflow-hidden rounded-[18px] bg-[#080c16] border border-[var(--line)] flex items-center justify-center ${className}`}
      style={{
        backgroundImage:
          'radial-gradient(circle at 40% 35%, rgba(37,99,255,0.28), transparent 60%), radial-gradient(circle at 75% 80%, rgba(239,43,58,0.18), transparent 55%)',
      }}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2563ff]/15 border border-[#38bdf8]/30 text-[#38bdf8]">
            <CategoryIcon className="h-7 w-7" />
          </div>
          <span className="text-xs font-medium text-[#9aa3b8] max-w-[200px] line-clamp-2">
            {alt}
          </span>
        </div>
      )}
    </div>
  );
};
