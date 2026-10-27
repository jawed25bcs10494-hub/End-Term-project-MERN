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
            <span className="artwork-fallback-genre">{isLoading ? 'SEARCHING OPEN GAME ART' : 'ARCHIVE COVER · ' + game.genre.toUpperCase()}</span>
          </div>
        )}
      </div>
      <figcaption className="game-artwork-caption">
        <span className="artwork-credit-label">GAME ARTWORK</span>
        {showImage && artwork ? (
          <>
            <span className="artwork-credit-detail">{artwork.artist ? `Credit: ${artwork.artist}` : artwork.fileTitle}{artwork.license ? ` · ${artwork.license}` : ''}</span>
            <a href={artwork.filePageUrl} target="_blank" rel="noopener noreferrer" aria-label={`View image credit and license for ${game.title}`}>
              View image credit & license <ExternalLink size={12} />
            </a>
            {artwork.licenseUrl && <a className="artwork-license-link" href={artwork.licenseUrl} target="_blank" rel="noopener noreferrer">License terms</a>}
          </>
        ) : (
          <span className="artwork-credit-detail">{isLoading ? 'Looking for a freely licensed image…' : 'No matching freely licensed artwork found; showing an archive cover.'}</span>
        )}
      </figcaption>
    </figure>
  )
}
