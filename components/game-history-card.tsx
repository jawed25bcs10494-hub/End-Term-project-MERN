import { Cpu, ExternalLink, Lightbulb, Star, Trophy } from 'lucide-react'
import type { GameHistoryEntry } from '@/lib/game-history'

type GameHistoryCardProps = {
  game: GameHistoryEntry
  isSaved: boolean
  onToggleSaved: () => void
}

export function GameHistoryCard({ game, isSaved, onToggleSaved }: GameHistoryCardProps) {
  const wikiUrl = `https://en.wikipedia.org/wiki/${game.sourceSlug}`

  return (
    <article className="artifact-card" aria-labelledby="artifact-title">
      <div className="artifact-hero">
        <div className="artifact-hero-copy">
          <div className="artifact-kicker"><span className="live-dot" />{game.year === 2026 ? '2026 · YEAR IN PROGRESS' : 'CURATOR PICK · YEARLY IMPACT'}</div>
          <h2 id="artifact-title">{game.title}</h2>
          <p className="artifact-byline">{game.developer}<span> / </span>{game.publisher}</p>
          <div className="artifact-tags"><span>{game.genre}</span><span>{game.platform}</span></div>
        </div>
        <div className="artifact-year-stamp" aria-hidden="true">{game.year}</div>
      </div>

      <div className="artifact-actions">
        <span className="editorial-label"><Trophy size={14} /> THE YEAR&apos;S DEFINING GAME</span>
        <button className={`save-button ${isSaved ? 'is-saved' : ''}`} type="button" onClick={onToggleSaved} aria-pressed={isSaved}>
          <Star size={14} fill={isSaved ? 'currentColor' : 'none'} />{isSaved ? 'Saved to archive' : 'Save this pick'}
        </button>
      </div>

      <section className="impact-section" aria-labelledby="impact-heading">
        <div className="section-heading"><span className="section-index">01 / WHY IT MATTERED</span><h3 id="impact-heading">The impact</h3></div>
        <p>{game.impact}</p>
      </section>

      <section className="specs-section" aria-labelledby="specs-heading">
        <div className="section-heading"><span className="section-index">02 / THE ARTIFACT</span><h3 id="specs-heading">People, platform & hardware</h3></div>
        <div className="spec-grid">
          <div className="spec-item"><span className="spec-label">CREATOR / DESIGN</span><strong>{game.creator}</strong></div>
          <div className="spec-item"><span className="spec-label">DEVELOPED BY</span><strong>{game.developer}</strong></div>
          <div className="spec-item"><span className="spec-label">PUBLISHED BY</span><strong>{game.publisher}</strong></div>
          <div className="spec-item"><span className="spec-label">ORIGINAL PLATFORM</span><strong>{game.platform}</strong></div>
          <div className="spec-item spec-item-wide"><span className="spec-label"><Cpu size={13} /> HARDWARE / REQUIREMENTS</span><strong>{game.hardware}</strong></div>
        </div>
      </section>

      <aside className="fun-fact" aria-label="Fun fact">
        <span className="fun-fact-icon"><Lightbulb size={18} /></span>
        <div><span className="section-index">03 / ARCHIVE ODDITY</span><h3>Did you know?</h3><p>{game.funFact}</p></div>
      </aside>

      <div className="source-row"><span>FURTHER READING</span><a href={wikiUrl} target="_blank" rel="noreferrer">Game history reference <ExternalLink size={13} /></a><span className="source-note">Curator selection; impact is an editorial judgment.</span></div>
    </article>
  )
}
