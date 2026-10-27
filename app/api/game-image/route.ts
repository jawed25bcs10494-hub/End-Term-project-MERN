import { NextResponse } from 'next/server'
import { gameHistory } from '@/lib/game-history'

const cacheHeaders = {
  'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
}

type MetadataValue = { value?: string }
type CommonsImageInfo = {
  thumburl?: string
  descriptionurl?: string
  extmetadata?: Record<string, MetadataValue>
}
type CommonsPage = {
  title: string
  imageinfo?: CommonsImageInfo[]
}
type CommonsResponse = {
  query?: { pages?: CommonsPage[] }
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function plainText(value = '') {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function isAllowedUrl(value: string | undefined, host: string) {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === host
  } catch {
    return false
  }
}

export async function GET(request: Request) {
  const year = Number(new URL(request.url).searchParams.get('year'))
  const game = gameHistory.find((entry) => entry.year === year)

  if (!Number.isInteger(year) || !game) {
    return NextResponse.json({ error: 'Unknown archive year.' }, { status: 400 })
  }

  const search = new URL('https://commons.wikimedia.org/w/api.php')
  search.searchParams.set('action', 'query')
  search.searchParams.set('generator', 'search')
  search.searchParams.set('gsrsearch', game.title)
  search.searchParams.set('gsrnamespace', '6')
  search.searchParams.set('gsrlimit', '10')
  search.searchParams.set('prop', 'imageinfo')
  search.searchParams.set('iiprop', 'url|extmetadata')
  search.searchParams.set('iiurlwidth', '1200')
  search.searchParams.set('format', 'json')
  search.searchParams.set('formatversion', '2')

  try {
    const response = await fetch(search, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'RetroGateGameHistory/1.0 (Wikimedia Commons image attribution)',
      },
      next: { revalidate: 86400 },
    })

    if (!response.ok) {
      return NextResponse.json({ image: null }, { headers: cacheHeaders })
    }

    const result = await response.json() as CommonsResponse
    const titleTokens = normalize(game.title).split(' ').filter((token) => token.length > 1 && !['the', 'and', 'of'].includes(token))
    const minimumMatches = titleTokens.length <= 2 ? titleTokens.length : Math.ceil(titleTokens.length * 0.6)

    const candidate = (result.query?.pages ?? [])
      .map((page) => {
        const image = page.imageinfo?.[0]
        const filename = normalize(page.title.replace(/^File:/i, ''))
        const matchCount = titleTokens.filter((token) => filename.includes(token)).length

        return { page, image, matchCount }
      })
      .filter(({ image, matchCount }) =>
        matchCount >= minimumMatches &&
        isAllowedUrl(image?.thumburl, 'upload.wikimedia.org') &&
        isAllowedUrl(image?.descriptionurl, 'commons.wikimedia.org'),
      )
      .sort((first, second) => second.matchCount - first.matchCount)[0]

    if (!candidate?.image?.thumburl || !candidate.image.descriptionurl) {
      return NextResponse.json({ image: null }, { headers: cacheHeaders })
    }

    const metadata = candidate.image.extmetadata ?? {}
    const artist = plainText(metadata.Artist?.value)
    const license = plainText(metadata.LicenseShortName?.value)

    return NextResponse.json({
      image: {
        url: candidate.image.thumburl,
        alt: `${game.title} artwork from Wikimedia Commons`,
        fileTitle: candidate.page.title.replace(/^File:/i, ''),
        filePageUrl: candidate.image.descriptionurl,
        artist: artist || null,
        license: license || null,
        licenseUrl: isAllowedUrl(metadata.LicenseUrl?.value, 'creativecommons.org')
          ? metadata.LicenseUrl?.value
          : null,
      },
    }, { headers: cacheHeaders })
  } catch {
    return NextResponse.json({ image: null }, { headers: cacheHeaders })
  }
}
