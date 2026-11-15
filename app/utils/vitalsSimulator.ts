// app/utils/vitalsSimulator.ts
import type { EnvSample, Scenario, VitalSample } from '~/types'

// random number between -amp/2 and +amp/2, to make values look alive
const noise = (amp: number) => (Math.random() - 0.5) * amp

/**
 * @param scenario  which situation to simulate
 * @param seconds   seconds since the scenario started
 */
export function simulateVitals(scenario: Scenario, seconds: number): VitalSample {
  let hr = 72
  let spo2 = 98
  let rr = 14
  let motion = 0.1 // normal small movements

  if (scenario === 'hypoxia') {
    spo2 = Math.max(84, 98 - seconds * 0.4) // below 90% after about 20 s
    hr = 72 + Math.min(40, seconds) // heart speeds up
    rr = 14 + Math.min(12, seconds / 3) // breathing speeds up
  }

  if (scenario === 'fall') {
    motion = seconds < 2 ? 6 : 0 // a 6 g shock, then no movement at all
  }

  // Gap analysis C-4: a suit problem during a spacewalk. Oxygen falls more
  // slowly than 'hypoxia' (WARNING first, CRITICAL later) while breathing
  // and heart rate climb. The page also marks "spacewalk just ended".
  if (scenario === 'eva-suit') {
    spo2 = Math.max(85, 97 - seconds * 0.3) // below 94 % after ~10 s, below 90 % after ~23 s
    rr = 14 + Math.min(14, seconds / 2) // fast breathing: WARNING above 24 after ~20 s
    hr = 80 + Math.min(30, seconds / 2)
    motion = 0.3 // working in the suit
  }

  // Gap analysis C-4: fainting during a gravity change. The heart races,
  // the person collapses (short impact), then lies still with a slow pulse.
  if (scenario === 'faint') {
    if (seconds < 8) {
      hr = 72 + seconds * 9 // up to about 140 bpm
    } else {
      hr = seconds < 12 ? 48 : 56 // slow pulse after the faint
      motion = seconds < 9 ? 4.5 : 0 // a 4.5 g impact, then no movement
    }
  }

  // Gap analysis C-7: asleep. Almost no movement; slower heart and breathing.
  if (scenario === 'sleeping') {
    hr = 58
    rr = 12
    motion = 0.01
  }

  // Gap analysis C-4: CO2 builds up in the cabin; breathing slowly speeds up
  if (scenario === 'co2-buildup') rr = 14 + Math.min(10, seconds / 10)

  return {
    ts: Date.now(),
    hr: Math.round(hr + noise(4)),
    spo2: Math.min(100, Math.round(spo2 + noise(1))),
    rr: Math.round(rr + noise(2)),
    skinTemp: Math.round((36.5 + noise(0.2)) * 10) / 10,
    motion: Math.round((motion + Math.abs(noise(0.04))) * 100) / 100,
  }
}

/**
 * Habitat sensors (gap analysis C-5): cabin CO2, cabin pressure and radiation dose rate.
 * @param scenario  which situation to simulate
 * @param seconds   seconds since the scenario started
 */
export function simulateEnv(scenario: Scenario, seconds: number): EnvSample {
  let pCO2 = 2.5 // mmHg, normal cabin
  let doseRate = 15 // µGy/h, normal orbit background (demo value)

  if (scenario === 'co2-buildup') pCO2 = Math.min(10, 2.5 + seconds * 0.1) // > 4 after 15 s, > 8 after 55 s
  if (scenario === 'solar-event') doseRate = Math.min(400, 15 + seconds * 8) // > 50 after 5 s, > 200 after 24 s

  return {
    ts: Date.now(),
    pCO2: Math.round((pCO2 + noise(0.2)) * 10) / 10,
    cabinPressure: Math.round((101.3 + noise(0.2)) * 10) / 10,
    doseRate: Math.max(0, Math.round(doseRate + noise(2))),
  }
}
