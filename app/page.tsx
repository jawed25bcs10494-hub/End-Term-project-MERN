'use client'

import { FormEvent, useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronUp,
  Gamepad2,
  Heart,
  Search,
  Send,
  Sparkles,
  Star,
  Volume2,
} from 'lucide-react'

type Game = {
  id: 'invaders' | 'pacman' | 'raycaster'
  title: string
  year: number
  genre: string
  maker: string
  description: string
  controls: string
  accent: string
}

type LogEntry = { id: number; gameId: Game['id']; author: string; text: string; time: string }

const games: Game[] = [
  {
    id: 'invaders', title: 'Space Invaders', year: 1978, genre: 'Shoot ’em up', maker: 'TAITO · ARCADE',
    description: 'A signal from the cabinet age. Hold the line, clear the formation, and don’t let a single invader reach the ground.',
    controls: '← → MOVE   ·   SPACE FIRE', accent: '#ffc65b',
  },
  {
    id: 'pacman', title: 'Pac-Man', year: 1980, genre: 'Maze chase', maker: 'NAMCO · ARCADE',
    description: 'One maze. Four ghosts. Eat every dot before they catch up. Power pellets turn the tables for a moment.',
    controls: '← ↑ ↓ → MOVE', accent: '#f8d548',
  },
  {
    id: 'raycaster', title: 'Doom: Sector 01', year: 1993, genre: 'First-person shooter', maker: 'ID SOFTWARE · PC',
    description: 'A tiny corridor of hell, reconstructed in a self-contained raycaster. Find the exit and keep moving.',
    controls: 'WASD MOVE   ·   ← → TURN   ·   SPACE FIRE', accent: '#ff5a50',
  },
]

const starterLogs: LogEntry[] = [
  { id: 1, gameId: 'invaders', author: 'pixelpilot', text: 'The sound design still gets me. That heartbeat speeding up as the row gets thinner is pure tension.', time: '2 min ago' },
  { id: 2, gameId: 'pacman', author: 'mariomode', text: 'Save the power pellets for the corners. You can chain the ghosts if you time it right.', time: 'Yesterday' },
]

const gameDocument = (gameId: Game['id']) => `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#080b0d;color:#e9e8dc;font:12px monospace}body{display:flex;flex-direction:column}.hud{height:38px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;color:#a4aaa8;background:#101617;border-bottom:1px solid #263034;letter-spacing:.1em;text-transform:uppercase}.hud b{color:#f4c95e;font-weight:700}canvas{display:block;width:100%;height:calc(100% - 38px);image-rendering:pixelated;touch-action:none}.overlay{position:absolute;inset:38px 0 0;display:grid;place-items:center;background:#05090bc9;text-align:center;padding:24px}.overlay[hidden]{display:none}.overlay strong{display:block;color:#f5cb61;font-size:15px;letter-spacing:.12em;margin-bottom:10px}.overlay span{color:#b4bcba;line-height:1.8}.overlay button{margin-top:16px;border:1px solid #f5cb61;color:#f5cb61;background:#111818;border-radius:10px;padding:10px 18px;font:inherit;cursor:pointer}.tip{position:absolute;bottom:14px;left:16px;color:#ffffff72;pointer-events:none;font-size:10px}
</style></head><body><div class="hud"><span>RETROGATE / <b id="title">ARCADE</b></span><span>SCORE <b id="score">000000</b></span></div><canvas id="game" aria-label="Playable retro arcade game"></canvas><div class="overlay" id="overlay"><div><strong id="message">READY PLAYER ONE</strong><span id="help"></span><br><button id="start">START GAME</button></div></div><div class="tip" id="tip"></div><script>
(()=>{const mode=${JSON.stringify(gameId)},canvas=document.getElementById('game'),ctx=canvas.getContext('2d'),scoreNode=document.getElementById('score'),overlay=document.getElementById('overlay'),msg=document.getElementById('message'),help=document.getElementById('help'),start=document.getElementById('start'),keys={};let W=0,H=0,score=0,running=false,last=0,frame=0,player,shots=[],enemies=[],dots=[],ghosts=[],map=[],walls=[];
const title=mode==='invaders'?'SPACE INVADERS':mode==='pacman'?'PAC-MAN':'SECTOR 01';document.getElementById('title').textContent=title;
help.textContent=mode==='invaders'?'← → to move · SPACE to fire':'';document.getElementById('tip').textContent=mode==='pacman'?'ARROW KEYS TO MOVE':'WASD TO MOVE · ARROWS TO TURN · SPACE TO FIRE';
function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);W=r.width;H=r.height;canvas.width=Math.max(1,Math.floor(W*d));canvas.height=Math.max(1,Math.floor(H*d));ctx.setTransform(d,0,0,d,0,0);if(mode==='raycaster')makeMap()}
new ResizeObserver(resize).observe(canvas);
function reset(){score=0;scoreNode.textContent='000000';shots=[];frame=0;if(mode==='invaders'){player={x:W/2,y:H-30};enemies=[];for(let row=0;row<4;row++)for(let col=0;col<9;col++)enemies.push({x:42+col*34,y:40+row*27,dir:1,alive:true})}else if(mode==='pacman'){player={x:1,y:1,dir:0};dots=[];ghosts=[{x:9,y:5,c:'#fa5a89'},{x:10,y:5,c:'#58d8eb'},{x:11,y:5,c:'#ff9f55'}];for(let y=0;y<12;y++)for(let x=0;x<16;x++)if(map[y]?.[x]===0)dots.push({x,y,alive:true})}else{player={x:1.5,y:1.5,a:0,health:100};enemies=[{x:10.5,y:8.5,alive:true},{x:14.5,y:2.5,alive:true},{x:4.5,y:12.5,alive:true}];makeMap()}}
function makeMap(){map=['1111111111111111','1000000000000001','1011101101110101','1000100000010001','1110101111011101','1000001000000001','1011101011101101','1000100000100001','1010111110101101','1000000000000001','1011101101110101','1000100000010001','1000000000000001','1111111111111111'].map(r=>r.split('').map(Number))}
function end(won){running=false;overlay.hidden=false;msg.textContent=won?'SECTOR CLEARED':'GAME OVER';help.textContent='SCORE '+score+' · PRESS START TO PLAY AGAIN';start.textContent='PLAY AGAIN'}
function begin(){reset();running=true;overlay.hidden=true;canvas.focus()}
start.addEventListener('click',begin);canvas.addEventListener('pointerdown',()=>canvas.focus());window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys[e.key.toLowerCase()]=true;if(!running&&e.key==='Enter')begin()});window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
function text(t,x,y,color='#fff',size=12){ctx.fillStyle=color;ctx.font='bold '+size+'px monospace';ctx.fillText(t,x,y)}
function invaders(dt){ctx.fillStyle='#080d10';ctx.fillRect(0,0,W,H);ctx.fillStyle='#ffc65b';ctx.fillRect(player.x-13,player.y,26,10);ctx.fillRect(player.x-4,player.y-7,8,8);if(keys.arrowleft||keys.a)player.x-=220*dt;if(keys.arrowright||keys.d)player.x+=220*dt;player.x=Math.max(15,Math.min(W-15,player.x));if(keys[' ']&&frame%12===0)shots.push({x:player.x,y:player.y-8});for(const s of shots){s.y-=330*dt;ctx.fillStyle='#fff2b0';ctx.fillRect(s.x-2,s.y,4,9)}shots=shots.filter(s=>s.y>0);let edge=false;for(const e of enemies){if(!e.alive)continue;e.x+=e.dir*30*dt;if(e.x>W-16||e.x<16)edge=true}if(edge)for(const e of enemies){e.dir*=-1;e.y+=9}for(const e of enemies){if(!e.alive)continue;ctx.fillStyle='#8ce9ae';ctx.fillRect(e.x-8,e.y-5,16,11);ctx.fillRect(e.x-11,e.y-1,4,5);ctx.fillRect(e.x+7,e.y-1,4,5);for(const s of shots)if(Math.abs(s.x-e.x)<10&&Math.abs(s.y-e.y)<10){e.alive=false;s.y=-20;score+=10;scoreNode.textContent=String(score).padStart(6,'0')}}if(enemies.every(e=>!e.alive))end(true);if(enemies.some(e=>e.y>player.y-15))end(false)}
function pacman(dt){const tile=Math.min(W/17,H/13),ox=(W-tile*16)/2,oy=(H-tile*12)/2;ctx.fillStyle='#03060b';ctx.fillRect(0,0,W,H);if(!map.length)makeMap();for(let y=0;y<12;y++)for(let x=0;x<16;x++){if(map[y][x]){ctx.fillStyle='#182c91';ctx.fillRect(ox+x*tile,oy+y*tile,tile,tile);ctx.strokeStyle='#4774ff';ctx.strokeRect(ox+x*tile+2,oy+y*tile+2,tile-4,tile-4)}}let dx=0,dy=0;if(keys.arrowleft||keys.a)dx=-1;if(keys.arrowright||keys.d)dx=1;if(keys.arrowup||keys.w)dy=-1;if(keys.arrowdown||keys.s)dy=1;const nx=player.x+dx*dt*4,ny=player.y+dy*dt*4;if(!map[Math.floor(ny)]?.[Math.floor(nx)]){player.x=nx;player.y=ny}for(const d of dots){if(!d.alive)continue;ctx.fillStyle='#ffeab0';ctx.beginPath();ctx.arc(ox+(d.x+.5)*tile,oy+(d.y+.5)*tile,2.4,0,Math.PI*2);ctx.fill();if(Math.hypot(player.x-(d.x+.5),player.y-(d.y+.5))<.36){d.alive=false;score+=10;scoreNode.textContent=String(score).padStart(6,'0')}}ctx.fillStyle='#ffe14c';ctx.beginPath();ctx.arc(ox+(player.x+.5)*tile,oy+(player.y+.5)*tile,tile*.42,.2,Math.PI*1.8);ctx.lineTo(ox+(player.x+.5)*tile,oy+(player.y+.5)*tile);ctx.fill();ghosts.forEach(g=>{g.x+=Math.sin(frame/35+g.y)*dt*.6;g.y+=Math.cos(frame/45+g.x)*dt*.5;ctx.fillStyle=g.c;ctx.beginPath();ctx.arc(ox+(g.x+.5)*tile,oy+(g.y+.5)*tile,tile*.38,Math.PI,0);ctx.lineTo(ox+(g.x+.88)*tile,oy+(g.y+.38)*tile);ctx.lineTo(ox+(g.x+.12)*tile,oy+(g.y+.38)*tile);ctx.fill();if(Math.hypot(player.x-g.x,player.y-g.y)<.55)end(false)});if(dots.every(d=>!d.alive))end(true)}
function ray(dt){ctx.fillStyle='#222329';ctx.fillRect(0,0,W,H/2);ctx.fillStyle='#38302e';ctx.fillRect(0,H/2,W,H/2);for(let i=0;i<8;i++){ctx.fillStyle='rgba(0,0,0,.1)';ctx.fillRect(0,H/2+i*H/16,W,H/16)}if(keys.arrowleft||keys.a)player.a-=dt*2;if(keys.arrowright||keys.d)player.a+=dt*2;const fwd=(keys.w||keys.arrowup)?1:(keys.s||keys.arrowdown)?-1:0,side=(keys.d?1:0)-(keys.a?1:0),nx=player.x+Math.cos(player.a)*fwd*dt*2.4+Math.cos(player.a+Math.PI/2)*side*dt*2,ny=player.y+Math.sin(player.a)*fwd*dt*2.4+Math.sin(player.a+Math.PI/2)*side*dt*2;if(!map[Math.floor(ny)]?.[Math.floor(nx)]){player.x=nx;player.y=ny}let hitExit=false;for(let x=0;x<W;x+=2){const angle=player.a+(x/W-.5)*1.12;let dist=0,hit=0,rx=player.x,ry=player.y;while(dist<18&&!hit){dist+=.035;rx=player.x+Math.cos(angle)*dist;ry=player.y+Math.sin(angle)*dist;if(map[Math.floor(ry)]?.[Math.floor(rx)])hit=1;if(Math.floor(rx)===13&&Math.floor(ry)===12)hitExit=true}const fix=dist*Math.cos(angle-player.a),height=Math.min(H,Math.max(1,H/(fix+.001)));let shade=Math.max(28,190-fix*17);ctx.fillStyle=hitExit?'#bca75f':'rgb('+shade+','+Math.floor(shade*.48)+','+Math.floor(shade*.35)+')';ctx.fillRect(x,(H-height)/2,2,height);if(hitExit&&player.x>12.1&&player.y>11.3)end(true)}if(keys[' ']&&frame%18===0){score+=1;scoreNode.textContent=String(score).padStart(6,'0');let target=enemies.find(e=>e.alive);if(target){target.alive=false;score+=100;scoreNode.textContent=String(score).padStart(6,'0')}}enemies.filter(e=>e.alive).forEach(e=>{const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<.6){player.health-=dt*12;if(player.health<=0)end(false)}});if(enemies.every(e=>!e.alive))end(true);if(keys[' ']){ctx.fillStyle='#ffe48c';ctx.fillRect(W/2-2,H/2-2,4,4)}text('HEALTH '+Math.max(0,Math.floor(player.health)),16,H-16,'#ff655d',12)}
function loop(now){const dt=Math.min((now-last)/1000||0,.05);last=now;frame++;if(running){if(mode==='invaders')invaders(dt);else if(mode==='pacman')pacman(dt);else ray(dt)}requestAnimationFrame(loop)}
makeMap();resize();reset();requestAnimationFrame(loop)})();
</script></body></html>`

function closestGame(year: number) {
  return games.reduce((closest, game) => Math.abs(game.year - year) < Math.abs(closest.year - year) ? game : closest, games[0])
}

function eraFor(year: number) {
  if (year < 1980) return '70s'
  if (year < 1990) return '80s'
  return '90s'
}

function RetroGateApp() {
  const [digits, setDigits] = useState([1, 9, 8, 0])
  const [activeYear, setActiveYear] = useState(1980)
  const [activeGame, setActiveGame] = useState<Game>(games[1])
  const [query, setQuery] = useState('')
  const [favorites, setFavorites] = useState<Game['id'][]>([])
  const [logs, setLogs] = useState(starterLogs)
  const [draft, setDraft] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const requestedYear = Number(digits.join(''))
  const era = eraFor(activeYear)
  const visibleGames = useMemo(() => games.filter((game) => `${game.title} ${game.year} ${game.genre}`.toLowerCase().includes(query.toLowerCase())), [query])
  const gameLogs = logs.filter((log) => log.gameId === activeGame.id)
  const isFavorite = favorites.includes(activeGame.id)

  function changeDigit(index: number) {
    setDigits((current) => current.map((digit, position) => position === index ? (digit + 1) % 10 : digit))
  }

  function enterYear() {
    const selected = closestGame(requestedYear)
    setActiveYear(requestedYear)
    setActiveGame(selected)
    setSubmitted(false)
  }

  function chooseGame(game: Game) {
    setActiveGame(game)
    setActiveYear(game.year)
    setDigits(String(game.year).padStart(4, '0').split('').map(Number))
    setSubmitted(false)
  }

  function toggleFavorite() {
    setFavorites((current) => current.includes(activeGame.id) ? current.filter((id) => id !== activeGame.id) : [...current, activeGame.id])
  }

  function postLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return
    setLogs((current) => [{ id: Date.now(), gameId: activeGame.id, author: 'you', text, time: 'Just now' }, ...current])
    setDraft('')
    setSubmitted(true)
  }

  return (
    <main className="retro-shell" data-era={era}>
      <div className="app-frame">
        <header className="topbar">
          <a className="brand" href="#home" aria-label="RetroGate home"><span className="brand-mark"><Gamepad2 size={20} /></span><span>RETRO<span className="brand-light">GATE</span></span></a>
          <div className="topbar-right"><span className="collection-status"><span className="status-dot" /> THE CLASSIC COLLECTION</span><span className="topbar-divider" /><span className="topbar-years">1970 — 1999</span></div>
        </header>

        <section className="intro-lock" id="home">
          <div className="intro-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> A PORTAL THROUGH PLAY</div>
            <h1>THE ARCADE,<br /><span>REWOUND.</span></h1>
            <p>Pick a year. Step back into the games<br className="desktop-break" /> that started it all.</p>
            <div className="era-indicator"><span className="era-dot" /> {era === '70s' ? 'THE 70s · ANALOG FRONTIER' : era === '80s' ? 'THE 80s · NEON ARCADE' : 'THE 90s · PIXEL TO POLYGON'}</div>
          </div>

          <div className="vault-card">
            <div className="vault-heading"><div><span className="section-index">01 / CHRONO LOCK</span><h2>Set your year</h2></div><span className="vault-seal"><Sparkles size={16} /></span></div>
            <div className="tumblers" role="group" aria-label="Year selector">
              {digits.map((digit, index) => <button className="tumbler" type="button" key={index} onClick={() => changeDigit(index)} aria-label={`Increment ${['thousands','hundreds','tens','ones'][index]} digit, currently ${digit}`}><span className="tumbler-up"><ChevronUp size={13} /></span><span className="digit">{digit}</span><span className="tumbler-down"><ArrowDown size={12} /></span></button>)}
            </div>
            <div className="vault-footer"><span className="year-hint">DESTINATION YEAR</span><button className="enter-button" type="button" onClick={enterYear}>ENTER <ArrowRight size={15} /></button></div>
            <div className="vault-base"><span /> <span /> <span /></div>
          </div>
        </section>

        <section className="workspace" aria-label="Retro game collection">
          <div className="main-column">
            <article className="player-card">
              <div className="player-heading"><div className="game-heading-copy"><div className="game-meta"><span className="section-index">NOW PLAYING</span><span className="meta-separator">/</span><span>{activeGame.maker}</span></div><h2>{activeGame.title}<span className="game-year">{activeGame.year}</span></h2></div><button className={`favorite-button ${isFavorite ? 'is-favorite' : ''}`} type="button" onClick={toggleFavorite} aria-pressed={isFavorite}><Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />{isFavorite ? 'Saved' : 'Save to favorites'}</button></div>
              <div className="game-screen"><iframe key={activeGame.id} title={`${activeGame.title} playable game`} srcDoc={gameDocument(activeGame.id)} sandbox="allow-scripts" /></div>
              <div className="player-info"><div><span className="info-label">THE STORY</span><p>{activeGame.description}</p></div><div className="player-controls"><span className="info-label">CONTROLS</span><span>{activeGame.controls}</span></div></div>
            </article>

            <section className="strategy-card" aria-labelledby="strategy-title">
              <div className="strategy-heading"><div><span className="section-index">FIELD NOTES · {gameLogs.length.toString().padStart(2, '0')}</span><h2 id="strategy-title">Strategy logs</h2></div><span className="logs-caption">FROM THE COMMUNITY</span></div>
              <form className="log-form" onSubmit={postLog}><label className="sr-only" htmlFor="log-entry">Share a strategy or review</label><input id="log-entry" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Share a tip for ${activeGame.title}…`} maxLength={240} /><button type="submit" aria-label="Post strategy log" disabled={!draft.trim()}><Send size={16} /></button></form>
              {submitted && <p className="post-confirmation" role="status"><Check size={13} /> Your field note is in the log.</p>}
              <div className="log-list">{gameLogs.length ? gameLogs.map((log) => <article className="log-entry" key={log.id}><div className="log-avatar" aria-hidden="true">{log.author.slice(0, 1).toUpperCase()}</div><div className="log-body"><div className="log-byline"><strong>{log.author}</strong><span>{log.time}</span></div><p>{log.text}</p></div></article>) : <p className="empty-logs">No field notes yet. Start the conversation.</p>}</div>
            </section>
          </div>

          <aside className="catalog-card" aria-labelledby="catalog-title">
            <div className="catalog-heading"><div><span className="section-index">02 / THE ARCHIVE</span><h2 id="catalog-title">Game catalog</h2></div><span className="catalog-count">{visibleGames.length.toString().padStart(2, '0')}</span></div>
            <label className="search-field"><Search size={16} /><span className="sr-only">Search games</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a classic…" /></label>
            <div className="catalog-list" aria-live="polite">{visibleGames.map((game, index) => <button className={`catalog-item ${activeGame.id === game.id ? 'selected' : ''}`} key={game.id} type="button" onClick={() => chooseGame(game)} aria-current={activeGame.id === game.id ? 'true' : undefined}><span className="catalog-number">0{index + 1}</span><span className="catalog-game"><strong>{game.title}</strong><span>{game.year} <i>·</i> {game.genre}</span></span><span className="catalog-arrow"><ArrowRight size={15} /></span></button>)}{visibleGames.length === 0 && <div className="no-results">No games match “{query}”.</div>}</div>
            <div className="catalog-rule" />
            <div className="quick-faves"><div className="quick-faves-heading"><span><Heart size={14} /> YOUR SAVED GAMES</span><span>{favorites.length.toString().padStart(2, '0')}</span></div>{favorites.length ? favorites.map((id) => { const game = games.find((item) => item.id === id)!; return <button type="button" className="saved-game" key={id} onClick={() => chooseGame(game)}><Star size={13} fill="currentColor" /><span>{game.title}</span><span>{game.year}</span></button> }) : <p className="empty-faves">Save a game to keep it close.</p>}</div>
            <div className="catalog-footnote"><Volume2 size={14} /><span>BEST PLAYED WITH SOUND ON</span></div>
          </aside>
        </section>

        <footer className="site-footer"><span>RETROGATE <i>©</i> THE GOLDEN AGE OF PLAY</span><span>THREE ERAS. INFINITE QUARTERS.</span></footer>
      </div>
    </main>
  )
}

export default RetroGateApp
