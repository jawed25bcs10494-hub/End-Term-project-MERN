import { NextResponse } from 'next/server'
import { gameHistory } from '@/lib/game-history'

const cacheHeaders = {
  'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
}

const userAgent = 'RetroGateGameHistory/1.0 (game artwork source attribution)'

type MetadataValue = { value?: string }
type WikiImageInfo = {
  title?: string
  thumburl?: string
  descriptionurl?: string
  extmetadata?: Record<string, MetadataValue>
}
type WikiPage = {
  title: string
  imageinfo?: WikiImageInfo[]
}
type WikiApiResponse = {
  query?: { pages?: WikiPage[] }
}
type WikiSummary = {
  type?: string
  title?: string
  thumbnail?: { source?: string }
  originalimage?: { source?: string }
  content_urls?: { desktop?: { page?: string } }
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

function isAllowedUrl(value: string | undefined, hosts: string[]) {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && hosts.includes(url.hostname)
  } catch {
    return false
  }
}

async function queryWikipediaApi(params: Record<string, string>) {
  const url = new URL('https://en.wikipedia.org/w/api.php')
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)

  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': userAgent },
    next: { revalidate: 86400 },
  })

  if (!response.ok) return null
  return await response.json() as WikiApiResponse
}

export async function GET(request: Request) {
  const year = Number(new URL(request.url).searchParams.get('year'))
  const game = gameHistory.find((entry) => entry.year === year)

  if (!Number.isInteger(year) || !game) {
    return NextResponse.json({ error: 'Unknown archive year.' }, { status: 400 })
  }

  try {
    const articleResponse = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(game.sourceSlug)}`,
      {
        headers: { Accept: 'application/json', 'User-Agent': userAgent },
        next: { revalidate: 86400 },
      },
    )

    if (!articleResponse.ok) {
      return NextResponse.json({ image: null }, { headers: cacheHeaders })
    }

    const article = await articleResponse.json() as WikiSummary
    const imageUrl = article.thumbnail?.source ?? article.originalimage?.source
    const originalImageUrl = article.originalimage?.source ?? imageUrl
    const articleUrl = article.content_urls?.desktop?.page

    if (
      article.type !== 'standard' ||
      !imageUrl ||
      !originalImageUrl ||
      !isAllowedUrl(imageUrl, ['upload.wikimedia.org']) ||
      !isAllowedUrl(originalImageUrl, ['upload.wikimedia.org'])
    ) {
      return NextResponse.json({ image: null }, { headers: cacheHeaders })
    }

    const filename = decodeURIComponent(new URL(originalImageUrl).pathname.split('/').pop() ?? '')
    if (!filename) return NextResponse.json({ image: null }, { headers: cacheHeaders })

    const imageResult = await queryWikipediaApi({
      action: 'query',
      titles: `File:${filename}`,
      redirects: '1',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: '1200',
      format: 'json',
      formatversion: '2',
    })
    const fileInfo = imageResult?.query?.pages?.[0]?.imageinfo?.[0]
    const displayUrl = isAllowedUrl(fileInfo?.thumburl, ['upload.wikimedia.org'])
      ? fileInfo?.thumburl
      : imageUrl

    if (!isAllowedUrl(displayUrl, ['upload.wikimedia.org'])) {
      return NextResponse.json({ image: null }, { headers: cacheHeaders })
    }

    const metadata = fileInfo?.extmetadata ?? {}
    const credit = plainText(metadata.Artist?.value ?? metadata.Credit?.value)
    const license = plainText(metadata.LicenseShortName?.value ?? metadata.UsageTerms?.value)
    const safeLicenseUrl = isAllowedUrl(metadata.LicenseUrl?.value, [
      'creativecommons.org',
      'www.gnu.org',
      'gnu.org',
    ])
      ? metadata.LicenseUrl?.value
      : null

    return NextResponse.json({
      image: {
        url: displayUrl,
        alt: `Image from the Wikipedia article about ${game.title}`,
        fileTitle: fileInfo?.title?.replace(/^File:/i, '') ?? filename,
        filePageUrl: isAllowedUrl(fileInfo?.descriptionurl, ['en.wikipedia.org', 'commons.wikimedia.org'])
          ? fileInfo?.descriptionurl
          : articleUrl,
        articleUrl: isAllowedUrl(articleUrl, ['en.wikipedia.org']) ? articleUrl : null,
        artist: credit || null,
        license: license || null,
        licenseUrl: safeLicenseUrl,
      },
    }, { headers: cacheHeaders })
  } catch {
    return NextResponse.json({ image: null }, { headers: cacheHeaders })
  }
}
