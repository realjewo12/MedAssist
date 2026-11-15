// scripts/check-step-lines.mjs
// Sprint 3: every instruction must fit on 2 lines on a phone (24 px text, 360 px screen).
// Measures each step (and its "you" version) in a real Chrome, using the app's own CSS.
//
// Usage: start the app first (npm run dev), then: npm run check:lines
// Needs Google Chrome or Chromium. Set CHROME=/path/to/chrome if it is not found.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const APP = process.env.APP_URL ?? 'http://localhost:3000/'
const WIDTH = 360 // a small Android phone
const PORT = 9399
const dir = new URL('../app/data/protocols/', import.meta.url)

const steps = []
for (const f of fs.readdirSync(dir)) {
  const p = JSON.parse(fs.readFileSync(new URL(f, dir), 'utf8'))
  for (const s of ['LOW', 'MODERATE', 'CRITICAL'])
    for (const st of p.steps[s])
      for (const t of [st.text, st.textSelf].filter(Boolean)) steps.push({ id: p.id, s, t })
}

const chromeBin = process.env.CHROME ?? 'google-chrome'
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'medassist-lines-'))
const chrome = spawn(chromeBin, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  'about:blank',
])
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const finish = async (code) => {
  // let Chrome close before removing its temporary profile
  const closed = new Promise((r) => chrome.once('exit', r))
  chrome.kill()
  await Promise.race([closed, wait(3000)])
  try {
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3 })
  } catch {
    // a leftover temp folder is harmless
  }
  process.exit(code)
}

try {
  let target
  for (let i = 0; i < 20 && !target; i++) {
    await wait(500)
    target = await fetch(`http://127.0.0.1:${PORT}/json/new?${APP}`, { method: 'PUT' })
      .then((r) => r.json())
      .catch(() => undefined)
  }
  if (!target) throw new Error(`Chrome did not start (${chromeBin}). Set CHROME=/path/to/chrome.`)

  const ws = new WebSocket(target.webSocketDebuggerUrl)
  let id = 0
  const pending = {}
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data)
    if (d.id) pending[d.id]?.(d.result)
  }
  await new Promise((r) => (ws.onopen = r))
  const send = (method, params = {}) =>
    new Promise((r) => {
      const i = ++id
      pending[i] = r
      ws.send(JSON.stringify({ id: i, method, params }))
    })
  await send('Emulation.setDeviceMetricsOverride', {
    width: WIDTH,
    height: 800,
    deviceScaleFactor: 2,
    mobile: true,
  })
  await send('Page.reload')
  // wait (up to 60 s) until the app has loaded: its <main> element exists
  for (let i = 0; i < 60; i++) {
    await wait(1000)
    const { result } = await send('Runtime.evaluate', {
      expression: "!!document.querySelector('main')",
      returnByValue: true,
    })
    if (result.value) break
  }

  // the same markup as components/emergency/InstructionCard.vue
  const { result } = await send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const main = document.querySelector('main')
      if (!main) return null
      return ${JSON.stringify(steps)}.map((x) => {
        const li = document.createElement('li'); li.className = 'rounded-2xl bg-space-800 p-4'
        const p = document.createElement('p'); p.className = 'text-step font-semibold'; p.textContent = x.t
        li.appendChild(p); main.appendChild(li)
        const lines = Math.round(p.getBoundingClientRect().height / parseFloat(getComputedStyle(p).lineHeight))
        li.remove()
        return { ...x, lines }
      })
    })()`,
  })
  if (!result.value) throw new Error(`The app did not load at ${APP}. Is "npm run dev" running?`)

  const tooLong = result.value.filter((x) => x.lines > 2)
  console.log(`${steps.length} step texts measured at ${WIDTH} px.`)
  for (const x of tooLong) console.log(`  ✗ ${x.lines} lines  ${x.id} ${x.s}: ${x.t}`)
  console.log(
    tooLong.length ? `${tooLong.length} step(s) need more than 2 lines.` : '✔ All fit on 2 lines.',
  )
  await finish(tooLong.length ? 1 : 0)
} catch (error) {
  console.error(String(error))
  await finish(2)
}
