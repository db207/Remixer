import { Anthropic } from '@anthropic-ai/sdk'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { base64File } = req.body
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
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
  } catch (error: any) {
    console.error('Error processing PDF:', error)
    res.status(500).json({ error: error.message || 'Failed to process PDF' })
  }
} 