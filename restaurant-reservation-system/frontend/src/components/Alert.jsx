/**
 * Reusable, dismissible alert banner.
 * Usage: <Alert type="error" message={errorMsg} onClose={() => setErrorMsg('')} />
 */
const Alert = ({ type = 'info', message, onClose }) => {
  if (!message) return null;

  return (
    <div className={`alert alert-${type}`} role="alert">
      <span>{message}</span>
      {onClose && (
        <button type="button" className="alert-close" onClick={onClose} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;
