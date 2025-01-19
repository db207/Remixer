import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import * as dotenv from 'dotenv'
import { Anthropic } from '@anthropic-ai/sdk'

// Load environment variables from .env file
dotenv.config()

const app = express()
const port = process.env.PORT || 3001

// Simple in-memory cache
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

app.use(cors())
app.use(express.json())

const TWITTER_API_BASE = 'https://api.twitter.com/2'
// Remove VITE_ prefix for Node.js environment
const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

if (!BEARER_TOKEN) {
  console.error('Twitter Bearer Token is not set in environment variables')
  process.exit(1)
}

if (!ANTHROPIC_API_KEY) {
  console.error('Anthropic API Key is not set in environment variables')
  process.exit(1)
}

// Add retry logic with exponential backoff
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Convert Unix timestamp to human readable time
const formatResetTime = (resetTime) => {
  const reset = new Date(resetTime * 1000)
  const now = new Date()
  const diffMinutes = Math.ceil((reset - now) / (1000 * 60))
  return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`
}

const fetchWithAuth = async (url, retries = 3, delay = 1000) => {
  // Check cache first
  const cachedData = cache.get(url)
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
    console.log('Returning cached data for:', url)
    return cachedData.data
  }

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${BEARER_TOKEN}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.status === 429) {
        const resetTime = response.headers.get('x-rate-limit-reset')
        const rateLimitRemaining = response.headers.get('x-rate-limit-remaining')
        const waitTime = formatResetTime(resetTime)
        console.log(`Rate limit hit. Remaining: ${rateLimitRemaining}, Reset in: ${waitTime}`)
        
        if (i < retries - 1) {
          const retryDelay = delay * Math.pow(2, i)
          console.log(`Retrying in ${retryDelay}ms...`)
          await wait(retryDelay)
          continue
        }
        
        throw new Error(`RATE_LIMIT_EXCEEDED:${waitTime}`)
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
      
      return data
    } catch (error) {
      if (i === retries - 1 || error.message.startsWith('RATE_LIMIT_EXCEEDED')) {
        throw error
      }
      const retryDelay = delay * Math.pow(2, i)
      console.log(`Request failed, retrying in ${retryDelay}ms...`)
      await wait(retryDelay)
    }
  }
}

app.get('/api/tweets/:id', async (req, res) => {
  try {
    const { id } = req.params
    console.log(`Fetching tweet ${id}...`)
    
    const data = await fetchWithAuth(
      `${TWITTER_API_BASE}/tweets/${id}?tweet.fields=conversation_id,created_at,text,entities,public_metrics,referenced_tweets&expansions=referenced_tweets.id,author_id,attachments.media_keys,entities.mentions.username,referenced_tweets.id.author_id&user.fields=name,username,profile_image_url&media.fields=url,preview_image_url,type`
    )
    
    console.log('Tweet API response:', data)
    res.json(data)
  } catch (error) {
    console.error('Error fetching tweet:', error)
    if (error.message.startsWith('RATE_LIMIT_EXCEEDED')) {
      const waitTime = error.message.split(':')[1]
      res.status(429).json({ 
        error: `Rate limit exceeded. Please try again in ${waitTime}.`,
        isRateLimit: true,
        resetTime: waitTime
      })
    } else {
      res.status(500).json({ error: error.message || 'Failed to fetch tweet' })
    }
  }
})

app.get('/api/tweets/conversation/:id', async (req, res) => {
  try {
    const { id } = req.params
    console.log(`Fetching conversation ${id}...`)
    
    const data = await fetchWithAuth(
      `${TWITTER_API_BASE}/tweets/search/recent?query=conversation_id:${id}&tweet.fields=conversation_id,created_at,text,referenced_tweets,author_id&expansions=referenced_tweets.id,author_id&max_results=100`
    )
    
    console.log('Conversation API response:', data)
    res.json(data)
  } catch (error) {
    console.error('Error fetching conversation:', error)
    if (error.message.startsWith('RATE_LIMIT_EXCEEDED')) {
      const waitTime = error.message.split(':')[1]
      res.status(429).json({ 
        error: `Rate limit exceeded. Please try again in ${waitTime}.`,
        isRateLimit: true,
        resetTime: waitTime
      })
    } else {
      res.status(500).json({ error: error.message || 'Failed to fetch conversation' })
    }
  }
})

app.post('/api/remix', async (req, res) => {
  try {
    const { inputText, outputType } = req.body
    const anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY
    })

    const prompt = outputType === 'tweets' 
      ? generateTweetsPrompt(inputText)
      : generateBlogPostPrompt(inputText)

    console.log('Sending request to Claude API...')
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: prompt
      }]
    })

    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : 'Received unexpected response format from API'

    res.json({ result: responseText })
  } catch (error) {
    console.error('Error calling Anthropic API:', error)
    res.status(500).json({ error: error.message || 'Failed to process content' })
  }
})

app.post('/api/process-pdf', async (req, res) => {
  try {
    const { base64File } = req.body
    const anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY
    })

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64File
            }
          },
          {
            type: "text",
            text: "Please read this PDF and extract its text content. Return just the text content without any additional commentary."
          }
        ]
      }]
    })

    const extractedText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : 'Error: Could not extract text from PDF'

    res.json({ result: extractedText })
  } catch (error) {
    console.error('Error processing PDF:', error)
    res.status(500).json({ error: error.message || 'Failed to process PDF' })
  }
})

app.listen(port, () => {
  console.log(`Proxy server running at http://localhost:${port}`)
  console.log('Environment variables loaded:', {
    BEARER_TOKEN: BEARER_TOKEN ? 'Set' : 'Not set',
    ANTHROPIC_API_KEY: ANTHROPIC_API_KEY ? 'Set' : 'Not set'
  })
}) 