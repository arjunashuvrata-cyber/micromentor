import React from 'react';

const variantClasses = {
  primary: 'bg-indigo-600 text-white',
  secondary: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  success: 'bg-green-500 text-white',
  warning: 'bg-yellow-500 text-white',
  info: 'bg-violet-500 text-white',
  outline: 'bg-transparent border border-slate-300 text-slate-700',
  destructive: 'bg-red-600 text-white',
};

const sizeClasses = {
  lg: 'rounded-md px-2 h-7 min-w-7 text-xs',
  md: 'rounded-md px-[0.45rem] h-6 min-w-6 text-xs',
  sm: 'rounded-sm px-[0.325rem] h-5 min-w-5 text-[0.6875rem] leading-[0.75rem]',
  xs: 'rounded-sm px-[0.25rem] h-4 min-w-4 text-[0.625rem] leading-[0.5rem]',
};

const shapeClasses = {
  default: '',
  circle: 'rounded-full',
};

function Badge({
  className = '',
  variant = 'primary',
  size = 'md',
  shape = 'default',
  disabled = false,
  ...props
}) {
  const base = 'inline-flex items-center justify-center border border-transparent font-medium';
  const variantClass = variantClasses[variant] || variantClasses.primary;
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const shapeClass = shapeClasses[shape] || shapeClasses.default;
  const disabledClass = disabled ? ' opacity-50 pointer-events-none' : '';

  const classes = `${base} ${variantClass} ${sizeClass} ${shapeClass}${disabledClass} ${className}`.trim();

  return (
    <span data-slot="badge" className={classes} {...props} />
  );
}

export default Badge;