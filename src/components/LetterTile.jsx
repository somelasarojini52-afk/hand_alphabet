export function LetterTile({ label, progress, locked }) {
  const long = label && label.length > 2;
  const classes = ['tile'];
  if (label) classes.push('has-label');
  if (locked) classes.push('is-locked');

  return (
    <div className={classes.join(' ')}>
      <svg className="tile__ring" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <rect className="ring-track" x="1.5" y="1.5" width="97" height="97" rx="12" />
        <rect
          className="ring-fill"
          x="1.5"
          y="1.5"
          width="97"
          height="97"
          rx="12"
          pathLength="100"
          strokeDasharray="100"
          strokeDashoffset={100 - progress * 100}
        />
      </svg>
      {/* key remounts the letter so it pops in whenever it changes or locks */}
      <div
        key={`${label || 'none'}-${locked}`}
        className={`tile__letter${long ? ' is-long' : ''}${label ? '' : ' is-empty'}`}
      >
        {label || '?'}
      </div>
    </div>
  );
}
