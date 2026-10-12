import { useCallback, useEffect, useRef, useState } from 'react';
import { MODEL_URL } from '../config';
import { IGNORED } from '../utils';

const UI_INTERVAL = 80; // ms between React state updates (the model itself runs every frame)
const GRACE_MS = 220; // short dips in confidence don't reset the hold timer

const freshTrack = () => ({ label: null, since: 0, lastOk: 0, locked: false, progress: 0 });
const idleHold = { label: null, progress: 0, locked: false };

function friendlyError(err, stage) {
  if (err && err.friendly) return err.message;
  if (stage === 'lib') return err.message;
  if (stage === 'model') {
    return `Couldn't load the model from ${MODEL_URL}. Check your internet connection and that the model link in src/config.js is correct and shared publicly.`;
  }
  const name = err && err.name;
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Camera access was blocked. Allow the camera in your browser address bar, then try again.';
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'No camera was found. Connect a webcam and try again.';
  }
  if (name === 'NotReadableError') {
    return 'Your camera is being used by another app. Close it and try again.';
  }
  return (err && err.message) || 'Something went wrong while starting the camera.';
}

export function useRecognizer({ threshold, holdMs, onLock }) {
  const [status, setStatus] = useState('idle'); // idle | loading-model | starting-camera | running | error
  const [error, setError] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [classCount, setClassCount] = useState(0);
  const [hold, setHold] = useState(idleHold);

  const modelRef = useRef(null);
  const webcamRef = useRef(null);
  const containerRef = useRef(null);
  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const sessionRef = useRef(0);
  const trackRef = useRef(freshTrack());
  const lastUiRef = useRef(0);
  const settingsRef = useRef({ threshold, holdMs, onLock });

  useEffect(() => {
    settingsRef.current = { threshold, holdMs, onLock };
  });

  // Decide what the latest frame means: is a sign being held steadily?
  const process = useCallback((raw) => {
    const now = performance.now();
    const { threshold: minConf, holdMs: needed, onLock: lock } = settingsRef.current;

    let best = raw[0];
    for (const p of raw) if (p.probability > best.probability) best = p;
    const ok = best.probability >= minConf && !IGNORED.test(best.className.trim());

    let justLocked = false;
    let t = trackRef.current;

    if (ok) {
      t.lastOk = now;
      if (t.label !== best.className) {
        t.label = best.className;
        t.since = now;
        t.locked = false;
        t.progress = 0;
      }
      if (!t.locked) {
        t.progress = Math.min(1, (now - t.since) / needed);
        if (t.progress >= 1) {
          t.locked = true;
          justLocked = true;
          if (lock) lock(best.className, best.probability);
        }
      }
    } else if (t.label && now - t.lastOk > GRACE_MS) {
      t = trackRef.current = freshTrack();
    }

    if (justLocked || now - lastUiRef.current >= UI_INTERVAL) {
      lastUiRef.current = now;
      setPredictions(raw.map((p) => ({ label: p.className, prob: p.probability })));
      setHold({ label: t.label, progress: t.progress, locked: t.locked });
    }
  }, []);

  // Loads the model once; shared by the camera and the image upload.
  const ensureModel = useCallback(async () => {
    if (modelRef.current) return modelRef.current;
    if (!window.tmImage) {
      const e = new Error('The Teachable Machine library did not load. Check your internet connection and reload the page.');
      e.friendly = true;
      throw e;
    }
    try {
      modelRef.current = await window.tmImage.load(`${MODEL_URL}model.json`, `${MODEL_URL}metadata.json`);
    } catch (err) {
      console.error(err);
      const e = new Error(friendlyError(err, 'model'));
      e.friendly = true;
      throw e;
    }
    setClassCount(modelRef.current.getTotalClasses());
    return modelRef.current;
  }, []);

  // Classify a single <img> element (used by the upload mode).
  const classifyImage = useCallback(
    async (image) => {
      const model = await ensureModel();
      const raw = await model.predict(image);
      return raw.map((p) => ({ label: p.className, prob: p.probability }));
    },
    [ensureModel]
  );

  const loop = useCallback(async () => {
    if (!runningRef.current) return;
    const webcam = webcamRef.current;
    const model = modelRef.current;
    try {
      webcam.update();
      const raw = await model.predict(webcam.canvas);
      if (!runningRef.current) return;
      process(raw);
    } catch (e) {
      console.error(e);
    }
    if (runningRef.current) rafRef.current = requestAnimationFrame(loop);
  }, [process]);

  const stop = useCallback(() => {
    sessionRef.current += 1;
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    const webcam = webcamRef.current;
    if (webcam) {
      try {
        webcam.stop();
      } catch (e) {
        /* ignore */
      }
      webcamRef.current = null;
    }
    if (containerRef.current) containerRef.current.replaceChildren();
    trackRef.current = freshTrack();
    setPredictions([]);
    setHold(idleHold);
    setStatus('idle');
  }, []);

  const start = useCallback(
    async (container) => {
      if (runningRef.current || !container) return;
      const session = ++sessionRef.current;
      containerRef.current = container;
      setError('');
      let stage = 'lib';

      try {
        if (!window.tmImage) {
          throw new Error(
            'The Teachable Machine library did not load. Check your internet connection and reload the page.'
          );
        }
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('This browser cannot access a camera. Use a recent Chrome, Edge, Firefox or Safari on localhost or HTTPS.');
        }

        if (!modelRef.current) {
          stage = 'model';
          setStatus('loading-model');
          await ensureModel();
        }
        if (session !== sessionRef.current) return;

        stage = 'camera';
        setStatus('starting-camera');
        const webcam = new window.tmImage.Webcam(400, 400, true); // width, height, mirror
        await webcam.setup();
        await webcam.play();
        if (session !== sessionRef.current) {
          webcam.stop();
          return;
        }

        webcamRef.current = webcam;
        container.replaceChildren(webcam.canvas);
        trackRef.current = freshTrack();
        runningRef.current = true;
        setStatus('running');
        rafRef.current = requestAnimationFrame(loop);
      } catch (err) {
        console.error(err);
        if (session !== sessionRef.current) return;
        setError(friendlyError(err, stage));
        setStatus('error');
      }
    },
    [loop, ensureModel]
  );

  useEffect(() => stop, [stop]);

  return { status, error, predictions, classCount, hold, start, stop, classifyImage };
}
