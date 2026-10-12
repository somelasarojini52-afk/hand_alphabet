# HandSpell - sign language alphabet recognition (React)

A React + Vite app that reads your hand signs from a live camera using your
Google Teachable Machine image model, then builds the letters into a word.

## Quick start

1. **Model:** already set to your hosted Teachable Machine link in `src/config.js`.
   To use a different model, replace the URL there (it must end with `/`).
2. **Install and run** (Node.js 18 or newer):
   ```bash
   npm install
   npm run dev
   ```
3. Open the page, press **Start camera**, and allow camera access.

The camera only works on `localhost` or HTTPS. An internet connection is needed
to load TensorFlow.js and the Teachable Machine library from the CDN (see
`index.html`) and the Google Fonts.

## Two ways to give input

- **Live camera:** hold a sign steady and it is added to your word.
- **Upload image:** choose or drag in a photo of a sign. The letter is shown with
  its confidence, and **Add to word** becomes available when the model is
  confident enough. Photos are center-cropped to a square, the same way the
  model sees them, so keep the hand in the middle of the frame.

## How the "correct output" works

Showing a raw prediction every frame flickers between letters. HandSpell only
accepts a letter when:

1. the model's top class is at or above the **minimum confidence** (default 85%), and
2. the same class stays on top for the **hold time** (default 1.0s).

While you hold a sign, a ring fills around the letter tile and the camera
corners turn orange; when the letter is accepted they turn green and the letter
is added to **Your word**. Both values can be changed live in *Tune recognition*.

Tips:
- To type a repeated letter (like "LL"), lower your hand and sign again.
- Train a class named `None`, `Nothing` or `Background` (an empty frame / resting hand).
  Classes with these names are never added to the word. This is the single best
  way to cut false letters.
- Use plain background, even lighting, and 50+ varied samples per letter.

## Project structure

```
src/App.jsx             page layout and word state
src/hooks/useRecognizer.js   camera, model, prediction loop, hold-to-confirm logic
src/components/         CameraStage, LetterTile, WordBuilder, ProbabilityList, Settings
src/styles.css          all styling
src/config.js           model URL and default settings
```

## Build for production

```bash
npm run build
npm run preview
```
