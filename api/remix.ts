import { Anthropic } from '@anthropic-ai/sdk'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { generateTweetsPrompt, generateBlogPostPrompt } from '../src/prompts'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { inputText, outputType } = req.body
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
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
  } catch (error: any) {
    console.error('Error calling Anthropic API:', error)
    res.status(500).json({ error: error.message || 'Failed to process content' })
  }
} 