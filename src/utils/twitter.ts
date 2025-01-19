import { API_BASE_URL } from './config'

// Remove the twitter-api-v2 import and use fetch directly
export const fetchTweet = async (tweetId: string) => {
  try {
    // Get the tweet with expanded fields using our proxy server
    const response = await fetch(`${API_BASE_URL}/api/tweets/${tweetId}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Twitter API error details:', errorData)
      
      if (response.status === 404) throw new Error('Tweet not found')
      if (response.status === 429) throw new Error('Rate limit exceeded. Please try again later.')
      throw new Error(`Twitter API error: ${response.status}`)
    }

    const tweet = await response.json()

    if (!tweet.data) {
      throw new Error('Tweet not found')
    }

    // If it's part of a thread, fetch the entire conversation
    if (tweet.data.conversation_id) {
      try {
        // Use the conversation lookup endpoint through our proxy
        const conversationResponse = await fetch(`${API_BASE_URL}/api/tweets/conversation/${tweet.data.conversation_id}`)

        if (!conversationResponse.ok) {
          const errorData = await conversationResponse.json().catch(() => ({}))
          console.error('Twitter API conversation error details:', errorData)
          throw new Error(`Twitter API error: ${conversationResponse.status}`)
        }

        const conversation = await conversationResponse.json()

        // Filter to get only tweets that are replies in the same thread
        const threadTweets = conversation.data?.filter((t: any) => 
          t.referenced_tweets?.some((ref: any) => 
            ref.type === 'replied_to' && 
            ref.id === tweet.data.conversation_id
          )
        ) || []

        // Sort tweets by creation date to maintain thread order
        const tweets = [tweet.data, ...threadTweets]
          .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map((t: any) => t.text)
          .join('\n\n---\n\n')

        return tweets
      } catch (error) {
        console.error('Error fetching thread:', error)
        // If thread fetch fails, return the original tweet
        return tweet.data.text
      }
    }

    // If it's a single tweet, return its text
    return tweet.data.text
  } catch (error: any) {
    console.error('Error fetching tweet:', error)
    throw error
  }
} 