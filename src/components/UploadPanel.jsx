import { useRef, useState } from 'react';

export function UploadPanel({ imageUrl, busy, error, onFile, onClear }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const pick = () => inputRef.current && inputRef.current.click();
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <section
      className={`stage upload${dragging ? ' is-drag' : ''}`}
      aria-label="Image upload"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files && e.target.files[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />

      {imageUrl && <img className="upload__img" src={imageUrl} alt="Your uploaded sign" />}

      {busy && (
        <div className="upload__busy" role="status">
          <span className="spinner" aria-hidden="true" />
          <p>Reading the sign…</p>
        </div>
      )}

      {!imageUrl && (
        <div className="stage__overlay">
          <h2 className="overlay__title">Drop a photo of a sign</h2>
          <p className="overlay__text">
            JPG, PNG or WebP. Center the hand and use a plain background. The photo stays on your device.
          </p>
          <button type="button" className="btn btn--primary btn--lg" onClick={pick}>
            Choose image
          </button>
          {error && (
            <p className="overlay__text overlay__text--error" role="alert">
              {error}
            </p>
          )}
        </div>
      )}

      {imageUrl && (
        <>
          {error && (
            <p className="upload__error" role="alert">
              {error}
            </p>
          )}
          <div className="upload__actions">
            <button type="button" className="btn btn--glass" onClick={pick}>
              Choose another
            </button>
            <button type="button" className="btn btn--glass" onClick={onClear}>
              Remove
            </button>
          </div>
        </>
      )}
    </section>
  );
}
