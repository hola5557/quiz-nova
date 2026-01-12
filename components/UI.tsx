import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { X, CheckCircle } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md', 
  ...props 
}) => {
  const baseStyles = "relative overflow-hidden rounded-full font-bold transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none shadow-[0_0_15px_rgba(0,0,0,0.3)] group";
  
  const variants = {
    primary: "bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white hover:shadow-[0_0_30px_rgba(217,70,239,0.5)] border border-white/20 hover:-translate-y-1 hover:brightness-110",
    secondary: "bg-slate-800 text-cyan-400 border border-cyan-500/30 hover:bg-slate-700 hover:border-cyan-400 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/10",
    glass: "bg-white/10 backdrop-blur-md text-white border border-white/10 hover:bg-white/20 hover:-translate-y-0.5 hover:shadow-lg",
    danger: "bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30"
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  return (
    <button 
      className={cn(baseStyles, variants[variant], sizes[size], className)} 
      {...props}
    >
      {/* Shine effect for primary buttons */}
      {variant === 'primary' && (
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer-diagonal_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent z-0 skew-x-[-15deg]" />
      )}
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string; hover?: boolean }> = ({ children, className, hover = false }) => {
  return (
    <div className={cn(
      "bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl transition-all duration-500 ease-out", 
      hover && "hover:border-white/20 hover:shadow-[0_0_40px_rgba(217,70,239,0.15)] hover:-translate-y-2",
      className
    )}>
      {children}
    </div>
  );
};

export const Label: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <label className={cn("block text-sm font-medium text-cyan-300 mb-2 uppercase tracking-wider", className)}>
    {children}
  </label>
);

export const SelectCard: React.FC<{ 
  selected: boolean; 
  onClick: () => void; 
  title: string; 
  icon?: React.ReactNode;
  description?: string;
}> = ({ selected, onClick, title, icon, description }) => (
  <div 
    onClick={onClick}
    className={cn(
      "cursor-pointer p-4 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center text-center gap-2 relative overflow-hidden transform group",
      selected 
        ? "bg-fuchsia-500/20 border-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.3)] scale-[1.03]" 
        : "bg-slate-800/50 border-white/10 hover:border-white/30 hover:bg-slate-800 hover:-translate-y-1 hover:shadow-lg"
    )}
  >
    {selected && (
      <>
        <div className="absolute inset-0 bg-fuchsia-500/10 animate-pulse pointer-events-none"></div>
        <div className="absolute top-2 right-2 text-fuchsia-400 animate-scale-in">
          <CheckCircle className="w-5 h-5 drop-shadow-[0_0_8px_rgba(232,121,249,0.5)]" />
        </div>
      </>
    )}
    
    {/* Subtle shine on hover */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>

    {icon && <div className={cn("text-2xl mb-1 relative z-10 transition-colors duration-300", selected ? "text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.5)]" : "text-slate-400 group-hover:text-fuchsia-300")}>{icon}</div>}
    <h3 className={cn("font-bold relative z-10 transition-colors duration-300", selected ? "text-white" : "text-slate-300 group-hover:text-white")}>{title}</h3>
    {description && <p className="text-xs text-slate-400 relative z-10">{description}</p>}
  </div>
);

export const Toggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
    <div 
        onClick={() => onChange(!checked)}
        className="flex items-center justify-between p-4 bg-slate-800/50 border border-white/10 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors group relative overflow-hidden"
    >
        <span className="font-medium text-slate-200 group-hover:text-white transition-colors relative z-10">{label}</span>
        <div className={cn("w-12 h-6 rounded-full p-1 transition-colors duration-300 relative z-10 shadow-inner", checked ? "bg-green-500" : "bg-slate-600")}>
            <div className={cn("bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300", checked ? "translate-x-6" : "translate-x-0")} />
        </div>
        {/* Hover highlight */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
);

export const Badge: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-fuchsia-100 text-fuchsia-800 shadow-[0_0_10px_rgba(217,70,239,0.3)]", className)}>
    {children}
  </span>
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-white z-10 bg-black/40 rounded-full p-1 transition-all hover:rotate-90 hover:bg-red-500/20 hover:text-red-400 duration-300"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="p-1 flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
};