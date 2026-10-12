// Your hosted Teachable Machine model (must end with a slash).
export const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/4ivQAFB1r/';

// To use local files instead, copy model.json, metadata.json and weights.bin into
// public/my_model/ and replace the line above with:
// export const MODEL_URL = `${import.meta.env.BASE_URL}my_model/`;

export const DEFAULTS = {
  threshold: 0.85, // minimum confidence before a sign counts
  holdMs: 1000, // how long a sign must be held steady to be added
};
