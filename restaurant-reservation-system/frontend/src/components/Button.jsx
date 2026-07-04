/**
 * Reusable button with a small set of visual variants.
 * Usage: <Button variant="primary" onClick={...}>Save</Button>
 */
const Button = ({
  children,
  variant = 'primary',
  type = 'button',
  disabled = false,
  loading = false,
  onClick,
  fullWidth = false,
  className = '',
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant} ${fullWidth ? 'btn-full' : ''} ${className}`}
    >
      {loading ? 'Please wait…' : children}
    </button>
  );
};

export default Button;
