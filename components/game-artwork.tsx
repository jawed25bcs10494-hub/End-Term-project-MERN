'use client'

import { useState } from 'react'
import Image from 'next/image'
import useSWR from 'swr'
import { ExternalLink } from 'lucide-react'
import type { GameHistoryEntry } from '@/lib/game-history'

type GameArtworkData = {
  image: {
    url: string
    alt: string
    fileTitle: string
    filePageUrl: string
    articleUrl: string | null
    artist: string | null
    license: string | null
    licenseUrl: string | null
  } | null
}

async function fetchArtwork(url: string): Promise<GameArtworkData> {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Artwork lookup failed')
  return response.json() as Promise<GameArtworkData>
}

export function GameArtwork({ game }: { game: GameHistoryEntry }) {
  const [imageFailed, setImageFailed] = useState(false)
  const { data, isLoading } = useSWR<GameArtworkData>(`/api/game-image?year=${game.year}`, fetchArtwork, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })
  const artwork = data?.image
  const showImage = Boolean(artwork && !imageFailed)

  return (
    <figure className="game-artwork" aria-label={`Artwork for ${game.title}`}>
      <div className={`game-artwork-visual ${showImage ? 'has-image' : ''}`} aria-busy={isLoading}>
        {showImage && artwork ? (
          <Image
            src={artwork.url}
            alt={artwork.alt}
            fill
            sizes="(max-width: 720px) 100vw, 70vw"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="game-artwork-fallback">
            <span className="artwork-fallback-year">{game.year}</span>
            <span className="artwork-fallback-title">{game.title}</span>
            <span className="artwork-fallback-genre">{isLoading ? 'VERIFYING THE GAME ARTICLE' : 'NO VERIFIED ART · CUSTOM ARCHIVE CARD'}</span>
          </div>
        )}
      </div>
      <figcaption className="game-artwork-caption">
        <span className="artwork-credit-label">GAME ARTWORK</span>
        {showImage && artwork ? (
          <>
            <span className="artwork-credit-detail">{artwork.artist ? `Credit: ${artwork.artist}` : artwork.fileTitle}{artwork.license ? ` · ${artwork.license}` : ''}</span>
            <a href={artwork.filePageUrl} target="_blank" rel="noopener noreferrer" aria-label={`View original image, source, and rights for ${game.title}`}>
              View original image & rights <ExternalLink size={12} />
            </a>
            {artwork.articleUrl && <a className="artwork-license-link" href={artwork.articleUrl} target="_blank" rel="noopener noreferrer">Game article</a>}
            {artwork.licenseUrl && <a className="artwork-license-link" href={artwork.licenseUrl} target="_blank" rel="noopener noreferrer">License terms</a>}
            <p className="artwork-rights-note">Game artwork remains the property of its respective rights holders.</p>
          </>
        ) : (
          <span className="artwork-credit-detail">{isLoading ? 'Checking the exact game article for its cover or title-screen image…' : 'No cover or title-screen image was found in this game’s exact article. Showing a clearly labeled archive reference card instead.'}</span>
        )}
      </figcaption>
    </figure>
  )
}
