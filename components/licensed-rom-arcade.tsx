'use client'

import { ChangeEvent, useMemo, useRef, useState } from 'react'
import { FileUp, Gamepad2, Search, ShieldCheck } from 'lucide-react'

type ArchivePick = { year: number; title: string; system: string }

const archivePicks: ArchivePick[] = [
  { year: 1970, title: 'Spacewar! (PDP-1)', system: 'COMPUTER CLASSIC' },
  { year: 1971, title: 'Computer Space', system: 'ARCADE' },
  { year: 1972, title: 'Pong', system: 'ARCADE' },
  { year: 1973, title: 'Space Race', system: 'ARCADE' },
  { year: 1974, title: 'Gran Trak 10', system: 'ARCADE' },
  { year: 1975, title: 'Gun Fight', system: 'ARCADE' },
  { year: 1976, title: 'Breakout', system: 'ARCADE' },
  { year: 1977, title: 'Space Wars', system: 'ARCADE' },
  { year: 1978, title: 'Space Invaders', system: 'ARCADE' },
  { year: 1979, title: 'Asteroids', system: 'ARCADE' },
  { year: 1980, title: 'Pac-Man', system: 'ARCADE' },
  { year: 1981, title: 'Donkey Kong', system: 'ARCADE' },
  { year: 1982, title: 'Dig Dug', system: 'ARCADE' },
  { year: 1983, title: 'Mario Bros.', system: 'ARCADE' },
  { year: 1984, title: '1942', system: 'ARCADE' },
  { year: 1985, title: 'Ghosts ’n Goblins', system: 'ARCADE' },
  { year: 1986, title: 'Bubble Bobble', system: 'ARCADE' },
  { year: 1987, title: 'Double Dragon', system: 'ARCADE' },
  { year: 1988, title: 'Ghouls ’n Ghosts', system: 'ARCADE' },
  { year: 1989, title: 'Final Fight', system: 'ARCADE' },
  { year: 1990, title: 'Raiden', system: 'ARCADE' },
  { year: 1991, title: 'Street Fighter II', system: 'ARCADE' },
  { year: 1992, title: 'Mortal Kombat', system: 'ARCADE' },
  { year: 1993, title: 'NBA Jam', system: 'ARCADE' },
  { year: 1994, title: 'Killer Instinct', system: 'ARCADE' },
  { year: 1995, title: 'Metal Slug', system: 'ARCADE' },
  { year: 1996, title: 'Area 51', system: 'ARCADE' },
  { year: 1997, title: 'Tekken 3', system: 'ARCADE' },
  { year: 1998, title: 'Dance Dance Revolution', system: 'ARCADE' },
  { year: 1999, title: 'The King of Fighters ’99', system: 'ARCADE' },
]

const emulatorDocument = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{box-sizing:border-box}html,body,#emulator{width:100%;height:100%;margin:0;background:#080b0d;color:#d7d7cc;font:12px monospace}body{overflow:hidden}#waiting{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:22px;color:#a0a9a6;line-height:1.8;background:radial-gradient(ellipse at center,#19211e,#080b0d 72%)}#waiting strong{display:block;color:#f4c95e;font-size:13px;letter-spacing:.12em;margin-bottom:8px}#waiting[hidden]{display:none}
</style></head><body><div id="emulator"></div><div id="waiting"><div><strong>READY FOR YOUR ROM</strong>Choose a licensed MAME-compatible .zip set to start.<br>ROMs are read in this browser and are not saved by RetroGate.</div></div><script>
window.addEventListener('message',function(event){if(event.source!==parent||event.data?.type!=='retrogate-rom'||!(event.data.bytes instanceof ArrayBuffer))return;const waiting=document.getElementById('waiting');waiting.innerHTML='<div><strong>LOADING ARCADE CORE</strong>Initializing the browser emulator…</div>';const gameUrl=URL.createObjectURL(new Blob([event.data.bytes],{type:'application/zip'}));window.EJS_player='#emulator';window.EJS_core='mame2003';window.EJS_gameUrl=gameUrl;window.EJS_gameName=event.data.title;window.EJS_pathtodata='https://cdn.emulatorjs.org/stable/data/';const loader=document.createElement('script');loader.src=window.EJS_pathtodata+'loader.js';loader.onerror=function(){waiting.innerHTML='<div><strong>EMULATOR UNAVAILABLE</strong>Could not load the EmulatorJS runtime. Check network access and try again.</div>'};document.body.appendChild(loader)});
</script></body></html>`

export function LicensedRomArcade() {
  const [selected, setSelected] = useState<ArchivePick>(archivePicks[10])
  const [search, setSearch] = useState('')
  const [fileName, setFileName] = useState('')
  const [status, setStatus] = useState('Select a year, then load the matching licensed MAME ROM set.')
  const [frameKey, setFrameKey] = useState(0)
  const pendingBytes = useRef<ArrayBuffer | null>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const filteredPicks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return archivePicks.filter((pick) => `${pick.year} ${pick.title} ${pick.system}`.toLowerCase().includes(normalizedSearch))
  }, [search])

  function choosePick(pick: ArchivePick) {
    setSelected(pick)
    setFileName('')
    setStatus('Choose the licensed ROM set for this title. It stays in this browser session.')
    pendingBytes.current = null
    setFrameKey((current) => current + 1)
  }

  async function loadRom(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setStatus('Choose a MAME-compatible .zip ROM set.')
      return
    }
    if (file.size > 100 * 1024 * 1024) {
      setStatus('This file is over the 100 MB browser limit. Choose a smaller ROM set.')
      return
    }
    try {
      pendingBytes.current = await file.arrayBuffer()
      setFileName(file.name)
      setStatus('Starting the emulator with your local ROM…')
      setFrameKey((current) => current + 1)
    } catch {
      setStatus('The ROM could not be read. Try selecting the file again.')
    }
  }

  function sendRomToFrame() {
    if (!pendingBytes.current) return
    frameRef.current?.contentWindow?.postMessage({
      type: 'retrogate-rom',
      title: `${selected.title} (${selected.year})`,
      bytes: pendingBytes.current,
    }, '*')
    pendingBytes.current = null
  }

  return (
    <section className="rom-arcade" aria-labelledby="rom-arcade-title">
      <div className="rom-arcade-heading">
        <div>
          <span className="section-index">03 / BRING YOUR OWN GAME</span>
          <h2 id="rom-arcade-title">Licensed ROM arcade</h2>
          <p>One archive pick for every year. Load a ROM you own to play the original game.</p>
        </div>
        <span className="rom-local-badge"><ShieldCheck size={14} /> LOCAL FILES</span>
      </div>

      <div className="rom-arcade-layout">
        <div className="rom-player-column">
          <div className="rom-selected-title">
            <span className="rom-year">{selected.year}</span>
            <div><strong>{selected.title}</strong><span>{selected.system} · MAME CORE</span></div>
          </div>
          <div className="rom-emulator-frame">
            <iframe
              key={`${selected.year}-${frameKey}`}
              ref={frameRef}
              title={`Licensed ROM player for ${selected.title}`}
              srcDoc={emulatorDocument}
              sandbox="allow-scripts allow-pointer-lock"
              allow="fullscreen"
              allowFullScreen
              onLoad={sendRomToFrame}
            />
          </div>
          <div className="rom-player-actions">
            <input ref={fileInputRef} className="sr-only" type="file" accept=".zip,application/zip,application/x-zip-compressed" onChange={loadRom} aria-label="Choose a licensed MAME ROM zip file" />
            <button className="rom-load-button" type="button" onClick={() => fileInputRef.current?.click()}><FileUp size={16} /> Load licensed ROM</button>
            <span className="rom-file-status" role="status">{fileName || status}</span>
          </div>
          <p className="rom-legal-note">ROMs are not included. Only load files you have the right to use; they stay in this browser session and RetroGate does not upload or save them. Matching ROM and BIOS support varies by title.</p>
        </div>

        <aside className="rom-archive" aria-label="Games by year">
          <div className="rom-archive-heading"><span className="section-index">THE 30-YEAR ARCHIVE</span><span>{filteredPicks.length.toString().padStart(2, '0')} TITLES</span></div>
          <label className="rom-search"><Search size={15} /><span className="sr-only">Search the year archive</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search year or title…" /></label>
          <div className="rom-archive-list" aria-live="polite">
            {filteredPicks.map((pick) => <button key={pick.year} className={`rom-archive-item ${selected.year === pick.year ? 'is-selected' : ''}`} type="button" onClick={() => choosePick(pick)} aria-pressed={selected.year === pick.year}><span className="rom-item-year">{pick.year}</span><span className="rom-item-copy"><strong>{pick.title}</strong><span>{pick.system}</span></span><Gamepad2 size={15} className="rom-item-icon" /></button>)}
            {filteredPicks.length === 0 && <p className="rom-no-results">No archive picks match that search.</p>}
          </div>
        </aside>
      </div>
    </section>
  )
}
