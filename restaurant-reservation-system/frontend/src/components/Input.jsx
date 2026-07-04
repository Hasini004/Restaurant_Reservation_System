/**
 * Reusable labeled input. Works for text/number/date/email/password
 * and for <select> when `as="select"` is passed with `children` options.
 */
const Input = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  min,
  as = 'input',
  children,
}) => {
  const commonProps = {
    id: name,
    name,
    value,
    onChange,
    required,
    className: `form-control ${error ? 'form-control-error' : ''}`,
  };

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="required-mark"> *</span>}
        </label>
      )}

      {as === 'select' ? (
        <select {...commonProps}>{children}</select>
      ) : (
        <input {...commonProps} type={type} placeholder={placeholder} min={min} />
      )}

      {error && <p className="form-error">{error}</p>}
    </div>
  );
};

export default Input;
