'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, BookOpen, ChevronUp, Gamepad2, Search, Send, Star } from 'lucide-react'
import { GameHistoryCard } from '@/components/game-history-card'
import { currentHistoryYear, firstHistoryYear, gameHistory } from '@/lib/game-history'

type ArchivistNote = { id: number; year: number; text: string; date: string }
type PersistedUserData = { savedYears: number[]; notes: ArchivistNote[] }

const USER_DATA_STORAGE_KEY = 'retrogate.user-data.v1'
const ARCHIVE_YEARS = new Set(gameHistory.map((game) => game.year))

function isArchivistNote(value: unknown): value is ArchivistNote {
  if (!value || typeof value !== 'object') return false
  const note = value as Partial<ArchivistNote>
  return typeof note.id === 'number' && Number.isFinite(note.id) &&
    typeof note.year === 'number' && ARCHIVE_YEARS.has(note.year) &&
    typeof note.text === 'string' && note.text.trim().length > 0 && note.text.length <= 240 &&
    typeof note.date === 'string'
}

function eraFor(year: number) {
  if (year < 1980) return '70s'
  if (year < 1990) return '80s'
  if (year < 2000) return '90s'
  if (year < 2010) return '00s'
  if (year < 2020) return '10s'
  return '20s'
}

export function GameHistoryMuseum() {
  const [activeYear, setActiveYear] = useState(1980)
  const [digits, setDigits] = useState('1980'.split('').map(Number))
  const [query, setQuery] = useState('')
  const [savedYears, setSavedYears] = useState<Set<number>>(() => new Set())
  const [notes, setNotes] = useState<ArchivistNote[]>([])
  const [userDataLoaded, setUserDataLoaded] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const [notePosted, setNotePosted] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_DATA_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<PersistedUserData>
        const validYears = Array.isArray(parsed.savedYears)
          ? parsed.savedYears.filter((year): year is number => Number.isInteger(year) && ARCHIVE_YEARS.has(year))
          : []
        const validNotes = Array.isArray(parsed.notes) ? parsed.notes.filter(isArchivistNote) : []
        setSavedYears(new Set(validYears))
        setNotes(validNotes)
      }
    } catch {
      // Keep the in-memory archive usable when browser storage is unavailable or malformed.
    } finally {
      setUserDataLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!userDataLoaded) return
    try {
      const data: PersistedUserData = { savedYears: [...savedYears], notes }
      localStorage.setItem(USER_DATA_STORAGE_KEY, JSON.stringify(data))
    } catch {
      // Notes and saved picks continue to work for this session if storage is unavailable.
    }
  }, [notes, savedYears, userDataLoaded])

  const activeGame = gameHistory.find((game) => game.year === activeYear) ?? gameHistory[0]
  const era = eraFor(activeYear)

  const visibleGames = useMemo(() => {
    const search = query.trim().toLowerCase()
    const archive = [...gameHistory].reverse()
    if (!search) return archive
    return archive.filter((game) => `${game.year} ${game.title} ${game.genre} ${game.creator} ${game.developer} ${game.platform}`.toLowerCase().includes(search))
  }, [query])

  const savedGames = useMemo(() => [...gameHistory].filter((game) => savedYears.has(game.year)).reverse(), [savedYears])
  const yearNotes = notes.filter((note) => note.year === activeYear)

  function selectYear(year: number) {
    const safeYear = Math.min(currentHistoryYear, Math.max(firstHistoryYear, year))
    setActiveYear(safeYear)
    setDigits(String(safeYear).padStart(4, '0').split('').map(Number))
    setNotePosted(false)
  }

  function incrementDigit(index: number) {
    const availableDigits = [...new Set(gameHistory.map((game) => String(game.year)[index]))].sort()
    const currentDigit = String(activeYear)[index]
    const nextDigit = availableDigits[(availableDigits.indexOf(currentDigit) + 1) % availableDigits.length]
    const nextGame = gameHistory
      .filter((game) => String(game.year)[index] === nextDigit)
      .sort((first, second) => Math.abs(first.year - activeYear) - Math.abs(second.year - activeYear) || second.year - first.year)[0]

    if (nextGame) selectYear(nextGame.year)
  }

  function toggleSaved() {
    if (!userDataLoaded) return
    setSavedYears((current) => {
      const next = new Set(current)
      if (next.has(activeYear)) next.delete(activeYear)
      else next.add(activeYear)
      return next
    })
  }

  function postNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!userDataLoaded) return
    const text = noteDraft.trim()
    if (!text) return
    setNotes((current) => [{ id: Date.now(), year: activeYear, text, date: new Date().toLocaleDateString() }, ...current])
    setNoteDraft('')
    setNotePosted(true)
  }

  return (
    <main className="retro-shell" data-era={era}>
      <div className="app-frame">
        <header className="topbar">
          <a className="brand" href="#home" aria-label="RetroGate home"><span className="brand-mark"><Gamepad2 size={19} /></span><span>RETRO<span className="brand-light">GATE</span></span></a>
          <div className="topbar-right"><span className="collection-status"><span className="status-dot" /> THE GAME HISTORY ARCHIVE</span><span className="topbar-divider" /><span className="topbar-years">1970 — {currentHistoryYear}</span></div>
        </header>

        <section className="intro-lock" id="home" aria-labelledby="page-title">
          <div className="intro-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> AN INTERACTIVE HISTORY OF PLAY</div>
            <h1 id="page-title">ONE YEAR.<br /><span>ONE GAME</span><br />THAT MOVED US.</h1>
            <p>Explore the game that made each year matter—<br className="desktop-break" />and the people, hardware, and ideas behind it.</p>
            <div className="era-indicator"><span className="era-dot" /> {era === '70s' ? 'THE 70s · ANALOG FRONTIER' : era === '80s' ? 'THE 80s · NEON ARCADE' : era === '90s' ? 'THE 90s · PIXEL TO POLYGON' : era === '00s' ? 'THE 00s · ONLINE WORLDS' : era === '10s' ? 'THE 10s · ALWAYS CONNECTED' : 'THE 20s · PLAY IN EVERY DIRECTION'}</div>
          </div>

          <div className="vault-card">
            <div className="vault-heading"><div><span className="section-index">01 / CHRONO LOCK</span><h2>Choose a year</h2></div><span className="vault-seal"><BookOpen size={17} /></span></div>
            <div className="tumblers" role="group" aria-label="Jump between valid archive years by digit">
              {digits.map((digit, index) => {
                const availableDigits = [...new Set(gameHistory.map((game) => String(game.year)[index]))].sort()
                return <button className="tumbler" type="button" key={index} onClick={() => incrementDigit(index)} aria-label={`Jump ${['thousands', 'hundreds', 'tens', 'ones'][index]} digit to the next valid value. Available: ${availableDigits.join(', ')}`} title={`Valid digits: ${availableDigits.join(', ')}`}><span className="tumbler-up"><ChevronUp size={12} /></span><span className="digit">{digit}</span><span className="tumbler-down"><ArrowDown size={11} /></span></button>
              })}
            </div>
            <div className="vault-footer"><span className="year-hint">VALID DIGITS · 1K: 1 / 2 · 100s: 0 / 9 · 10s: 0–2, 7–9 · 1s: 0–9</span></div>
            <label className="year-range-label" htmlFor="year-range">Or scrub the timeline</label>
            <input id="year-range" className="year-range" type="range" min={firstHistoryYear} max={currentHistoryYear} value={activeYear} onChange={(event) => selectYear(Number(event.currentTarget.value))} aria-label={`Browse by year. Currently ${activeYear}`} />
            <div className="range-ends"><span>{firstHistoryYear}</span><span>{currentHistoryYear} · NOW</span></div>
            <div className="vault-base"><span /><span /><span /></div>
          </div>
        </section>

        <section className="workspace" aria-label="Yearly game history archive">
          <div className="main-column">
            <div className="year-nav"><button type="button" onClick={() => selectYear(activeYear - 1)} disabled={activeYear === firstHistoryYear}><ArrowLeft size={15} /> PREVIOUS YEAR</button><span>ARCHIVE ENTRY <strong>{String(activeYear).padStart(4, '0')}</strong></span><button type="button" onClick={() => selectYear(activeYear + 1)} disabled={activeYear === currentHistoryYear}>NEXT YEAR <ArrowRight size={15} /></button></div>
            <GameHistoryCard game={activeGame} isSaved={savedYears.has(activeYear)} isSaveDisabled={!userDataLoaded} onToggleSaved={toggleSaved} />

            <section className="strategy-card" aria-labelledby="notes-title">
              <div className="strategy-heading"><div><span className="section-index">FIELD NOTES · {String(yearNotes.length).padStart(2, '0')}</span><h2 id="notes-title">Archivist notes</h2></div><span className="logs-caption">YOUR NOTES FOR {activeYear}</span></div>
              <form className="log-form" onSubmit={postNote}><label className="sr-only" htmlFor="archivist-note">Add a note about this game</label><input id="archivist-note" value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder={`Add a memory or detail about ${activeGame.title}…`} maxLength={240} /><button type="submit" aria-label="Post archivist note" disabled={!userDataLoaded || !noteDraft.trim()}><Send size={16} /></button></form>
              {notePosted && <p className="post-confirmation" role="status">Your note was added to the archive.</p>}
              <div className="log-list">{yearNotes.length ? yearNotes.map((note) => <article className="log-entry" key={note.id}><div className="log-avatar" aria-hidden="true">A</div><div className="log-body"><div className="log-byline"><strong>ARCHIVIST</strong><span>{note.date}</span></div><p>{note.text}</p></div></article>) : <p className="empty-logs">{userDataLoaded ? 'No notes for this year yet. Add a memory, correction, or detail.' : 'Loading archivist notes…'}</p>}</div>
            </section>
          </div>

          <aside className="catalog-card" aria-labelledby="catalog-title">
            <div className="catalog-heading"><div><span className="section-index">02 / THE ARCHIVE</span><h2 id="catalog-title">Every year</h2></div><span className="catalog-count">{String(visibleGames.length).padStart(2, '0')}</span></div>
            <label className="search-field"><Search size={15} /><span className="sr-only">Search archive by year, title, creator, genre, or platform</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the timeline…" /></label>
            <div className="catalog-list" aria-live="polite">{visibleGames.map((game) => <button className={`catalog-item ${activeYear === game.year ? 'selected' : ''}`} key={game.year} type="button" onClick={() => selectYear(game.year)} aria-current={activeYear === game.year ? 'date' : undefined}><span className="catalog-number">{game.year}</span><span className="catalog-game"><strong>{game.title}</strong><span>{game.genre}<i> · </i>{game.developer}</span></span><span className="catalog-arrow"><ArrowRight size={14} /></span></button>)}{visibleGames.length === 0 && <div className="no-results">No entries match “{query}”.</div>}</div>
            <div className="catalog-rule" />
            <div className="quick-faves"><div className="quick-faves-heading"><span><Star size={13} /> SAVED PICKS</span><span>{String(savedGames.length).padStart(2, '0')}</span></div>{savedGames.length ? savedGames.map((game) => <button type="button" className="saved-game" key={game.year} onClick={() => selectYear(game.year)}><Star size={12} fill="currentColor" /><span>{game.title}</span><span>{game.year}</span></button>) : <p className="empty-faves">{userDataLoaded ? 'Save a curator pick to keep it close.' : 'Loading saved picks…'}</p>}</div>
            <div className="catalog-footnote"><BookOpen size={14} /><span>57 YEARS · 57 CURATOR PICKS</span></div>
          </aside>
        </section>

        <footer className="site-footer"><span>RETROGATE <i>©</i> A LIVING HISTORY OF PLAY</span><span>ONE YEAR AT A TIME · 1970–{currentHistoryYear}</span></footer>
      </div>
    </main>
  )
}
