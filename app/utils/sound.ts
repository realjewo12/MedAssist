// app/utils/sound.ts
export function beep(durationMs = 600): void {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    osc.frequency.value = 880
    osc.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + durationMs / 1000)
    osc.onended = () => ctx.close()
  } catch {
    // sound not available: ignore
  }
}
