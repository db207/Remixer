import '@testing-library/jest-dom'
import { beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { HttpResponse, http } from 'msw'

// Mock handlers for Twitter API
const handlers = [
  // Single tweet
  http.get('*/2/tweets/:tweetId', ({ params }) => {
    const { tweetId } = params

    if (tweetId === '123456789') {
      return HttpResponse.json({
        data: {
          id: '123456789',
          text: 'This is a test tweet',
          conversation_id: null,
          created_at: '2024-01-19T10:00:00.000Z',
          author_id: 'user123',
          public_metrics: {
            retweet_count: 5,
            reply_count: 2,
            like_count: 10,
            quote_count: 1,
          },
          entities: {
            mentions: [],
            hashtags: [],
            urls: [],
          },
        },
        includes: {
          users: [{
            id: 'user123',
            name: 'Test User',
            username: 'testuser',
            profile_image_url: 'https://example.com/avatar.jpg',
          }],
        },
      })
    }

    if (tweetId === '987654321') {
      return HttpResponse.json({
        data: {
          id: '987654321',
          text: 'This is tweet 1 in the thread',
          conversation_id: 'thread123',
          created_at: '2024-01-19T10:00:00.000Z',
          author_id: 'user123',
          referenced_tweets: [],
        },
        includes: {
          users: [{
            id: 'user123',
            name: 'Test User',
            username: 'testuser',
            profile_image_url: 'https://example.com/avatar.jpg',
          }],
        },
      })
    }

    if (tweetId === 'invalid-id') {
      return new HttpResponse(null, { status: 404 })
    }

    if (tweetId === 'rate-limited') {
      return new HttpResponse(null, { status: 429 })
    }

    return HttpResponse.json({ data: null })
  }),

  // Thread search
  http.get('*/2/tweets/search/recent', ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('query')

    if (query?.includes('conversation_id:thread123')) {
      return HttpResponse.json({
        data: [
          {
            id: '987654321',
            text: 'This is tweet 1 in the thread',
            created_at: '2024-01-19T10:00:00.000Z',
            author_id: 'user123',
            referenced_tweets: [{ type: 'replied_to', id: 'thread123' }],
          },
          {
            id: '987654322',
            text: 'This is tweet 2 in the thread',
            created_at: '2024-01-19T10:01:00.000Z',
            author_id: 'user123',
            referenced_tweets: [{ type: 'replied_to', id: 'thread123' }],
          }
        ],
        includes: {
          users: [{
            id: 'user123',
            name: 'Test User',
            username: 'testuser',
            profile_image_url: 'https://example.com/avatar.jpg',
          }],
        },
      })
    }

    return HttpResponse.json({ data: [] })
  })
]

const server = setupServer(...handlers)

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))

// Close server after all tests
afterAll(() => server.close())

// Reset handlers after each test
afterEach(() => server.resetHandlers()) 