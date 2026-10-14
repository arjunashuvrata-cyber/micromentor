/**
 * Reusable card-like wrapper used to group related form fields/content
 * under a title and optional description.
 *
 * @param {Object} props
 * @param {string} props.title - Section heading.
 * @param {string} [props.description] - Optional supporting text under the heading.
 * @param {React.ReactNode} props.children - Section content (fields, buttons, etc.).
 */
function FormSection({ title, description, children }) {
  return (
    <section className="w-full rounded-2xl bg-white p-6 shadow-md ring-1 ring-slate-200 sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}

export default FormSection
