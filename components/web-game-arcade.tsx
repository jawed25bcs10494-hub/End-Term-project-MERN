import { ExternalLink, Gamepad2, ShieldCheck } from 'lucide-react'

export function WebGameArcade() {
  return (
    <section className="web-arcade" aria-labelledby="web-arcade-title">
      <div className="web-arcade-heading">
        <div>
          <span className="section-index">03 / AD-FREE WEB GAMES</span>
          <h2 id="web-arcade-title">Play the arcade</h2>
          <p>Pick a game from a collection of free, instant-play browser classics.</p>
        </div>
        <span className="web-arcade-badge"><ShieldCheck size={14} /> THIRD-PARTY PORTAL</span>
      </div>

      <div className="web-arcade-panel">
        <div className="web-arcade-card">
          <div className="web-arcade-art" aria-hidden="true">
            <span>PLAY</span>
            <Gamepad2 size={52} strokeWidth={1.2} />
            <span>REPEAT</span>
          </div>
          <div className="web-arcade-details">
            <span className="web-arcade-source">PLAYHIVE.NET <span aria-hidden="true">/</span> 23 GAMES</span>
            <h3>Choose your next game.</h3>
            <p>Open a free browser arcade with games like 2048, Snake, Minesweeper, Chess, and Galaxy Blaster. No ROMs or downloads needed.</p>
            <div className="web-arcade-tags" aria-label="Game collection features">
              <span>NO ADS</span><span>NO SIGN-UP</span><span>PLAY IN BROWSER</span>
            </div>
            <a className="web-arcade-open" href="https://playhive.net/" target="_blank" rel="noreferrer">
              <ExternalLink size={15} /> Browse and play
            </a>
          </div>
        </div>
        <p className="web-arcade-note">
          Games open on PlayHive, a third-party open-source project. Its live site currently states that it has no ads, trackers, or sign-ups; that service and its policies are outside RetroGate&apos;s control.
        </p>
      </div>
    </section>
  )
}
