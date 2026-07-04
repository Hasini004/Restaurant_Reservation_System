const Loader = ({ label = 'Loading…' }) => (
  <div className="loader">
    <div className="spinner" aria-hidden="true" />
    <span>{label}</span>
  </div>
);

export default Loader;
