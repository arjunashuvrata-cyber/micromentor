const VARIANT_CLASSES = {
  primary:
    'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600',
  secondary:
    'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus-visible:outline-slate-400',
  danger:
    'bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600',
}

/**
 * Reusable button component used throughout the app for primary actions,
 * secondary/toggle actions, and destructive/retry actions.
 *
 * @param {Object} props
 * @param {string} props.label - Visible text rendered inside the button.
 * @param {'primary'|'secondary'|'danger'} [props.variant='primary'] - Visual style of the button.
 * @param {(event: React.MouseEvent<HTMLButtonElement>) => void} [props.onClick] - Click handler.
 * @param {boolean} [props.disabled=false] - Disables the button and dims it.
 * @param {boolean} [props.fullWidth=false] - Stretches the button to fill its container's width.
 * @param {'button'|'submit'} [props.type='button'] - Native button type.
 */
function Button({
  label,
  variant = 'primary',
  onClick,
  disabled = false,
  fullWidth = false,
  type = 'button',
}) {
  const variantClasses = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold',
        'shadow-sm transition-colors duration-150 focus-visible:outline focus-visible:outline-2',
        'focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses,
        fullWidth ? 'w-full' : '',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

export default Button
