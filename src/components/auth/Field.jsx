/** Label + control + error/hint, wired for screen readers. */
export default function Field({ id, label, error, hint, children }) {
  return (
    <div className="fld">
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? <p className="err" id={`${id}-msg`} role="alert">{error}</p>
        : hint ? <p className="hint" id={`${id}-msg`}>{hint}</p> : null}
    </div>
  );
}
