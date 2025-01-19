import type { VercelRequest, VercelResponse } from '@vercel/node'

const TWITTER_API_BASE = 'https://api.twitter.com/2'
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id } = req.query
    console.log(`Fetching tweet ${id}...`)
    
    const url = `${TWITTER_API_BASE}/tweets/${id}?tweet.fields=conversation_id,created_at,text,entities,public_metrics,referenced_tweets&expansions=referenced_tweets.id,author_id,attachments.media_keys,entities.mentions.username,referenced_tweets.id.author_id&user.fields=name,username,profile_image_url&media.fields=url,preview_image_url,type`
    
    // Check cache
    const cachedData = cache.get(url)
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      console.log('Returning cached data for:', url)
      return res.json(cachedData.data)
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (response.status === 429) {
      const resetTime = response.headers.get('x-rate-limit-reset')
      const rateLimitRemaining = response.headers.get('x-rate-limit-remaining')
      const waitTime = Math.ceil((Number(resetTime) * 1000 - Date.now()) / (1000 * 60))
      console.log(`Rate limit hit. Remaining: ${rateLimitRemaining}, Reset in: ${waitTime} minutes`)
      return res.status(429).json({ 
        error: `Rate limit exceeded. Please try again in ${waitTime} minutes.`,
        isRateLimit: true,
        resetTime: waitTime
      })
    }
    
    if (!response.ok) {
      const error = await response.json()
      console.error('Twitter API error:', error)
      throw new Error(`Twitter API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Cache the successful response
    cache.set(url, {
      data,
      timestamp: Date.now()
    })
    
    res.json(data)
  } catch (error: any) {
    console.error('Error fetching tweet:', error)
    res.status(500).json({ error: error.message || 'Failed to fetch tweet' })
  }
} 