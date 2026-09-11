import './Loader.css';

export default function Loader({ label = 'Verifying details…' }) {
  return (
    <div className="loader" role="status">
      <div className="loader-dots">
        <span />
        <span />
        <span />
      </div>
      <p>{label}</p>
    </div>
  );
}
