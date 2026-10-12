// Classes with these names mean "no sign" and are never added to the word.
export const IGNORED = /^(none|nothing|background|blank|neutral|idle|empty|no[ _-]?sign)$/i;

export function speak(text) {
  if (!('speechSynthesis' in window) || !text || !text.trim()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}
