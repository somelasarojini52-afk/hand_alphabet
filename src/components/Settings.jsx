export function Settings({ threshold, setThreshold, holdMs, setHoldMs, speakLetters, setSpeakLetters }) {
  return (
    <section className="settings card">
      <h2 className="h2">Tune recognition</h2>

      <label className="field">
        <span className="field__row">
          <span>Minimum confidence</span>
          <output>{Math.round(threshold * 100)}%</output>
        </span>
        <input
          type="range"
          min="50"
          max="99"
          step="1"
          value={Math.round(threshold * 100)}
          onChange={(e) => setThreshold(Number(e.target.value) / 100)}
        />
        <span className="field__hint">Higher means fewer wrong letters, but signs need to be clearer.</span>
      </label>

      <label className="field">
        <span className="field__row">
          <span>Hold time</span>
          <output>{(holdMs / 1000).toFixed(1)}s</output>
        </span>
        <input
          type="range"
          min="400"
          max="2500"
          step="100"
          value={holdMs}
          onChange={(e) => setHoldMs(Number(e.target.value))}
        />
        <span className="field__hint">How long a sign must stay steady before it is added.</span>
      </label>

      <label className="check">
        <input
          type="checkbox"
          checked={speakLetters}
          onChange={(e) => setSpeakLetters(e.target.checked)}
        />
        <span>Say each letter aloud when it is added</span>
      </label>
    </section>
  );
}
