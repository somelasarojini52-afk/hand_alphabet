export function ProbabilityList({ predictions, limit = 5 }) {
  const rows = [...predictions].sort((a, b) => b.prob - a.prob).slice(0, limit);

  return (
    <section className="probs card">
      <h2 className="h2">Top guesses</h2>
      {rows.length === 0 ? (
        <p className="muted">Start the camera or upload an image to see what the model thinks.</p>
      ) : (
        <ul className="probs__list">
          {rows.map((r, i) => {
            const pct = Math.round(r.prob * 100);
            return (
              <li key={r.label} className={`prob${i === 0 ? ' is-top' : ''}`}>
                <span className="prob__label">{r.label}</span>
                <span className="prob__bar">
                  <span className="prob__fill" style={{ width: `${pct}%` }} />
                </span>
                <span className="prob__pct">{pct}%</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
