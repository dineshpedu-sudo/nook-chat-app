export default function SecurityBadge({ connected }) {
  return (
    <div className={`security-badge ${connected ? 'secure' : 'insecure'}`}>
      <span className="security-dot" />
      {connected ? 'Connected · session secured' : 'Connecting…'}
    </div>
  );
}
