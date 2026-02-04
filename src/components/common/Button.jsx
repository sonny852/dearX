import React, { memo } from 'react';

const Button = memo(function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}) {
  const baseClasses =
    'font-semibold transition-all duration-200 cursor-pointer disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-gradient-to-br from-coral to-gold text-white shadow-lg shadow-coral/40 hover:shadow-coral/60 disabled:opacity-50',
    secondary:
      'bg-coral/10 border border-coral/30 text-coral hover:bg-coral/20',
    ghost:
      'bg-transparent border border-coral/25 text-coral hover:bg-coral/10',
    outline:
      'bg-transparent border border-coral/30 text-cream/70 hover:text-cream hover:border-coral/50',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 text-base rounded-xl',
    lg: 'px-6 py-3 text-lg rounded-2xl',
    xl: 'px-8 py-4 text-xl rounded-2xl',
    icon: 'p-3 rounded-full',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
