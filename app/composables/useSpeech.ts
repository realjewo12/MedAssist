// app/composables/useSpeech.ts
export function useSpeech() {
  function speak(text: string) {
    if (!('speechSynthesis' in window)) return // not supported: do nothing
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }
  function stop() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  }
  return { speak, stop }
}
