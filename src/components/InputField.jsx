/**
 * Reusable labeled input component supporting text/email/password inputs
 * as well as a multi-line textarea, with optional inline validation error.
 *
 * @param {Object} props
 * @param {string} props.label - Label text displayed above the field.
 * @param {'text'|'email'|'password'|'textarea'} [props.type='text'] - Field type.
 * @param {string} props.value - Current field value (controlled component).
 * @param {(event: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => void} props.onChange - Change handler.
 * @param {string} [props.placeholder] - Placeholder text.
 * @param {string} [props.error] - Error message shown under the field when present.
 * @param {boolean} [props.required=false] - Marks the field as required and shows an asterisk.
 * @param {string} [props.name] - Name/id attribute for the field, used to associate the label.
 */
function InputField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  name,
}) {
  const fieldId = name || label?.toLowerCase().replace(/\s+/g, '-')

  const sharedClasses = [
    'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900',
    'placeholder:text-slate-400 shadow-sm transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
    error ? 'border-red-400' : 'border-slate-300',
  ].join(' ')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}

      {type === 'textarea' ? (
        <textarea
          id={fieldId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          rows={4}
          className={sharedClasses}
        />
      ) : (
        <input
          id={fieldId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={sharedClasses}
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

export default InputField
