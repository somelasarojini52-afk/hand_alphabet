import { useState } from 'react';

export function WordBuilder({ tokens, onSpace, onBackspace, onClear, onSpeak, onCopy, holdSeconds, mode }) {
  const [copied, setCopied] = useState(false);
  const empty = tokens.length === 0;

  const handleCopy = async () => {
    const ok = await onCopy();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    }
  };

  return (
    <section className="word card">
      <div className="word__head">
        <h2 className="h2">Your word</h2>
        <span className="word__count">{tokens.filter((t) => t !== ' ').length} letters</span>
      </div>

      <div className="word__tiles" aria-live="polite">
        {empty ? (
          <p className="word__empty">
            {mode === 'upload'
              ? 'Upload a photo and add its letter here.'
              : `Hold a sign steady for ${holdSeconds}s and its letter lands here.`}
          </p>
        ) : (
          tokens.map((t, i) => (
            <span key={i} className={`chip${t === ' ' ? ' chip--space' : ''}`}>
              {t === ' ' ? '' : t}
            </span>
          ))
        )}
      </div>

      <div className="word__actions">
        <button type="button" className="btn btn--soft" onClick={onSpace}>
          Add space
        </button>
        <button type="button" className="btn btn--soft" onClick={onBackspace} disabled={empty}>
          Delete last
        </button>
        <button type="button" className="btn btn--soft" onClick={onClear} disabled={empty}>
          Clear
        </button>
        <span className="word__spacer" />
        <button type="button" className="btn btn--soft" onClick={handleCopy} disabled={empty}>
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button type="button" className="btn btn--primary" onClick={onSpeak} disabled={empty}>
          Read aloud
        </button>
      </div>
    </section>
  );
}
