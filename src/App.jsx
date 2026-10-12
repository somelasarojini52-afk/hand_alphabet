import { useCallback, useMemo, useRef, useState } from 'react';
import { CameraStage } from './components/CameraStage.jsx';
import { UploadPanel } from './components/UploadPanel.jsx';
import { LetterTile } from './components/LetterTile.jsx';
import { WordBuilder } from './components/WordBuilder.jsx';
import { ProbabilityList } from './components/ProbabilityList.jsx';
import { Settings } from './components/Settings.jsx';
import { useRecognizer } from './hooks/useRecognizer.js';
import { DEFAULTS } from './config.js';
import { speak, IGNORED } from './utils.js';

export default function App() {
  const stageRef = useRef(null);
  const [mode, setMode] = useState('camera'); // camera | upload
  const [tokens, setTokens] = useState([]);
  const [threshold, setThreshold] = useState(DEFAULTS.threshold);
  const [holdMs, setHoldMs] = useState(DEFAULTS.holdMs);
  const [speakLetters, setSpeakLetters] = useState(false);

  // upload mode state
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadPreds, setUploadPreds] = useState([]);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const addToken = useCallback(
    (label) => {
      setTokens((t) => [...t, label]);
      if (speakLetters) speak(label);
    },
    [speakLetters]
  );

  const { status, error, predictions, classCount, hold, start, stop, classifyImage } = useRecognizer({
    threshold,
    holdMs,
    onLock: addToken,
  });

  const running = status === 'running';

  const switchMode = (next) => {
    if (next === mode) return;
    if (next === 'upload') stop();
    setMode(next);
  };

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setUploadError('That file is not an image. Choose a JPG, PNG or WebP photo.');
      return;
    }
    if (uploadUrl) URL.revokeObjectURL(uploadUrl);
    const url = URL.createObjectURL(file);
    setUploadUrl(url);
    setUploadError('');
    setUploadPreds([]);
    setUploadBusy(true);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      setUploadPreds(await classifyImage(img));
    } catch (e) {
      console.error(e);
      setUploadError(e.friendly ? e.message : 'Could not read that image. Try a different photo.');
    } finally {
      setUploadBusy(false);
    }
  };

  const clearUpload = () => {
    if (uploadUrl) URL.revokeObjectURL(uploadUrl);
    setUploadUrl('');
    setUploadPreds([]);
    setUploadError('');
  };

  const bestOf = (list) => (list.length ? list.reduce((a, b) => (b.prob > a.prob ? b : a)) : null);
  const top = useMemo(() => bestOf(predictions), [predictions]);
  const uploadTop = useMemo(() => bestOf(uploadPreds), [uploadPreds]);

  // ---- what the result panel shows, per mode ----
  let tile = { label: null, progress: 0, locked: false };
  let stateText;
  let hint;
  let shown = null; // the prediction the meter describes
  let canAdd = false;

  if (mode === 'camera') {
    shown = running ? top : null;
    if (running) {
      tile = { label: hold.label, progress: hold.progress, locked: hold.locked };
      if (hold.locked) {
        stateText = 'Added to your word';
        hint = 'Change your sign, or lower your hand and sign again for a repeat letter.';
      } else if (hold.label) {
        stateText = 'Hold steady…';
        hint = `Keep the sign still for ${(holdMs / 1000).toFixed(1)}s to add it.`;
      } else {
        stateText = 'Looking for a sign';
        hint = 'Show one sign clearly, with good light on your hand.';
      }
    } else {
      stateText = 'Camera is off';
      hint = 'Press Start camera to begin.';
    }
  } else {
    shown = uploadTop;
    const ok = !!uploadTop && uploadTop.prob >= threshold && !IGNORED.test(uploadTop.label.trim());
    canAdd = ok;
    if (uploadBusy) {
      stateText = 'Reading the sign…';
      hint = 'This only takes a moment.';
    } else if (!uploadUrl) {
      stateText = 'No image yet';
      hint = 'Choose or drop a photo of a hand sign.';
    } else if (ok) {
      tile = { label: uploadTop.label, progress: 1, locked: true };
      stateText = 'Recognized';
      hint = 'Add it to your word, or upload another photo.';
    } else if (uploadTop) {
      stateText = 'Not sure about this one';
      hint = 'Try a clearer photo with the hand centered, in good light.';
    } else {
      stateText = 'No result';
      hint = 'Something went wrong. Try another photo.';
    }
  }

  const pct = shown ? Math.round(shown.prob * 100) : 0;
  const listPreds = mode === 'upload' ? uploadPreds : running ? predictions : [];

  const copyWord = async () => {
    try {
      await navigator.clipboard.writeText(tokens.join(''));
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="shell">
      <header className="top">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">A</span>
          <span className="brand__name">HandSpell</span>
        </div>
        <div className="top__copy">
          <h1 className="h1">Sign a letter. Watch it spell.</h1>
          <p className="lede">
            Use your camera or upload a photo of a hand sign. HandSpell reads the letter and builds your word.
          </p>
        </div>
        <span className={`chip-status${classCount ? ' is-ready' : ''}`}>
          {classCount ? `Model ready: ${classCount} signs` : 'Model loads when you start'}
        </span>
      </header>

      <main className="grid">
        <div className="col">
          <div className="modes" role="group" aria-label="Input type">
            <button type="button" aria-pressed={mode === 'camera'} onClick={() => switchMode('camera')}>
              Live camera
            </button>
            <button type="button" aria-pressed={mode === 'upload'} onClick={() => switchMode('upload')}>
              Upload image
            </button>
          </div>

          {mode === 'camera' ? (
            <CameraStage
              ref={stageRef}
              status={status}
              error={error}
              candidate={!!hold.label}
              locked={hold.locked}
              onStart={() => start(stageRef.current)}
              onStop={stop}
            />
          ) : (
            <UploadPanel
              imageUrl={uploadUrl}
              busy={uploadBusy}
              error={uploadError}
              onFile={handleFile}
              onClear={clearUpload}
            />
          )}

          <ProbabilityList predictions={listPreds} />
        </div>

        <div className="col">
          <section className="result card">
            <LetterTile label={tile.label} progress={tile.progress} locked={tile.locked} />
            <div className="result__info">
              <p className="result__state" aria-live="polite">
                {stateText}
              </p>
              <p className="result__hint">{hint}</p>
              <div
                className="meter"
                role="img"
                aria-label={`Confidence ${pct} percent, minimum ${Math.round(threshold * 100)} percent`}
              >
                <div className="meter__fill" style={{ width: `${pct}%` }} />
                <div className="meter__tick" style={{ left: `${threshold * 100}%` }} />
              </div>
              <div className="meter__legend">
                <span>{shown ? `Best guess: ${shown.label}` : 'No guess yet'}</span>
                <span>{pct}%</span>
              </div>
              {mode === 'upload' && (
                <button
                  type="button"
                  className="btn btn--primary result__add"
                  disabled={!canAdd}
                  onClick={() => addToken(uploadTop.label)}
                >
                  {canAdd ? `Add "${uploadTop.label}" to word` : 'Add to word'}
                </button>
              )}
            </div>
          </section>

          <WordBuilder
            tokens={tokens}
            holdSeconds={(holdMs / 1000).toFixed(1)}
            mode={mode}
            onSpace={() => setTokens((t) => (t.length && t[t.length - 1] !== ' ' ? [...t, ' '] : t))}
            onBackspace={() => setTokens((t) => t.slice(0, -1))}
            onClear={() => setTokens([])}
            onSpeak={() => speak(tokens.join(''))}
            onCopy={copyWord}
          />

          <Settings
            threshold={threshold}
            setThreshold={setThreshold}
            holdMs={holdMs}
            setHoldMs={setHoldMs}
            speakLetters={speakLetters}
            setSpeakLetters={setSpeakLetters}
          />
        </div>
      </main>

      <footer className="foot">
        Recognition runs on your device. The model is loaded from the link in <code>src/config.js</code>.
      </footer>
    </div>
  );
}
