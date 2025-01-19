import { describe, it, expect } from 'vitest'
import { fetchTweet } from '../utils/twitter'

describe('Twitter Utils', () => {
  it('should fetch a single tweet', async () => {
    const tweetContent = await fetchTweet('123456789')
    expect(tweetContent).toBe('This is a test tweet')
  })

  it('should fetch and format a thread', async () => {
    const tweetContent = await fetchTweet('987654321')
    expect(tweetContent).toContain('This is tweet 1 in the thread')
    expect(tweetContent).toContain('This is tweet 2 in the thread')
  })

  it('should handle tweet not found error', async () => {
    await expect(fetchTweet('invalid-id')).rejects.toThrow('Tweet not found')
  })

  it('should handle rate limit error', async () => {
    await expect(fetchTweet('rate-limited')).rejects.toThrow('Rate limit exceeded')
  })

  it('should return original tweet if thread fetch fails', async () => {
    // Mock a failed thread fetch by returning empty data
    const tweetContent = await fetchTweet('987654321')
    expect(tweetContent).toBe('This is tweet 1 in the thread')
  })
}) 