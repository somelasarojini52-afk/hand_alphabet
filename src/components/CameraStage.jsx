import { forwardRef } from 'react';

const BUSY_TEXT = {
  'loading-model': 'Loading the sign model…',
  'starting-camera': 'Starting your camera…',
};

export const CameraStage = forwardRef(function CameraStage(
  { status, error, candidate, locked, onStart, onStop },
  videoRef
) {
  const running = status === 'running';
  const busy = status === 'loading-model' || status === 'starting-camera';

  const classes = ['stage'];
  if (running) classes.push('is-live');
  if (running && candidate) classes.push('is-candidate');
  if (running && locked) classes.push('is-locked');

  return (
    <section className={classes.join(' ')} aria-label="Live camera">
      {/* The webcam canvas is mounted here by the recognizer hook */}
      <div className="stage__video" ref={videoRef} />

      <i className="corner tl" />
      <i className="corner tr" />
      <i className="corner bl" />
      <i className="corner br" />

      {running && (
        <>
          <span className="pill">
            <span className="pill__dot" />
            Live
          </span>
          <button type="button" className="btn btn--glass stage__stop" onClick={onStop}>
            Stop camera
          </button>
          <p className="stage__tip">Keep your hand inside the frame</p>
        </>
      )}

      {!running && (
        <div className="stage__overlay">
          {busy && (
            <>
              <span className="spinner" aria-hidden="true" />
              <p className="overlay__text" role="status">
                {BUSY_TEXT[status]}
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <h2 className="overlay__title">The camera didn't start</h2>
              <p className="overlay__text overlay__text--error" role="alert">
                {error}
              </p>
              <button type="button" className="btn btn--primary" onClick={onStart}>
                Try again
              </button>
            </>
          )}

          {status === 'idle' && (
            <>
              <h2 className="overlay__title">Show a sign, see the letter</h2>
              <p className="overlay__text">
                Everything runs in your browser. Your video is never uploaded.
              </p>
              <button type="button" className="btn btn--primary btn--lg" onClick={onStart}>
                Start camera
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
});
