import { useState } from 'react'
import Anthropic from '@anthropic-ai/sdk'

function App() {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleRemix = async () => {
    setIsLoading(true)
    try {
      const anthropic = new Anthropic({
        apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
        dangerouslyAllowBrowser: true
      })

      console.log('Sending request to Claude API...')
      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: `You are a social media and finance expert. You work for a company called, "XSY" a next generation DeFi protocol and you are tasked with creating social media posts for the company. 
          
          You want your tweets to optimize for engagement and growth (read: likes, replies and retweets)
          Remember the only reasons people post things on social media is:
          1. To sound smart
          2. To be funny
          3. To look hot
          4. To look rich

          Return your response in this exact JSON format:
          {
            "tweets": [
              {
                "content": "tweet text here",
                "isThread": false,
                "threadPosition": null
              }
            ]
          }

          For threads, set isThread to true and use threadPosition (1-based) to indicate the tweet's position in the thread.
          Do not use any hashtags or emojis.
          Please provide at least five tweets.

          Here's the source material: ${inputText}`
        }]
      })

      console.log('Received response:', message)
      const responseText = message.content[0].type === 'text' 
        ? message.content[0].text 
        : 'Received unexpected response format from API'
      
      try {
        const parsedResponse = JSON.parse(responseText)
        setOutputText(responseText) // Keep the raw JSON for now
      } catch (error) {
        setOutputText('Error: Response was not in the expected JSON format')
      }
    } catch (error: any) {
      console.error('Detailed error:', error)
      setOutputText(`Error: ${error.message || 'Unknown error occurred'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold text-gray-800 tracking-tight">Content Remixer</h1>
          <p className="text-gray-600">Transform your text into something creative and unique</p>
        </div>
        
        <div className="space-y-6 bg-white p-8 rounded-2xl shadow-lg">
          <div>
            <label htmlFor="input" className="block text-lg font-semibold text-gray-700 mb-3">
              Input Text
            </label>
            <textarea
              id="input"
              className="w-full h-48 p-4 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ease-in-out"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your text here to remix..."
            />
          </div>

          <button
            onClick={handleRemix}
            disabled={isLoading || !inputText}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 ease-in-out hover:scale-[1.02] font-medium text-lg shadow-md"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Remixing...
              </span>
            ) : 'Remix Content'}
          </button>

          <div>
            <label htmlFor="output" className="block text-lg font-semibold text-gray-700 mb-3">
              Remixed Output
            </label>
            <div className="space-y-8">
              {(() => {
                try {
                  const tweets = JSON.parse(outputText)?.tweets || []
                  const threads: { [key: string]: any[] } = {}
                  const singleTweets: any[] = []

                  // Separate threads and single tweets
                  tweets.forEach((tweet: any) => {
                    if (tweet.isThread) {
                      // Group all thread tweets together regardless of position
                      const threadKey = 'thread'
                      if (!threads[threadKey]) {
                        threads[threadKey] = []
                      }
                      threads[threadKey].push(tweet)
                    } else {
                      singleTweets.push(tweet)
                    }
                  })

                  return (
                    <>
                      {/* Display Threads */}
                      {threads['thread'] && (
                        <div key="thread" className="bg-white rounded-xl shadow-sm p-4">
                          <h3 className="text-sm font-medium text-gray-500 mb-3">Thread</h3>
                          <div className="space-y-3">
                            {threads['thread']
                              .sort((a, b) => a.threadPosition - b.threadPosition)
                              .map((tweet: any, tweetIndex: number) => (
                                <div 
                                  key={tweetIndex}
                                  className={`relative pl-6 border-l-2 border-gray-200 ${tweetIndex === threads['thread'].length - 1 ? 'border-l-0' : ''}`}
                                >
                                  <div className="absolute left-0 top-0 -translate-x-[5px] w-2.5 h-2.5 rounded-full bg-gray-300" />
                                  <div className={`bg-gray-50 rounded-lg p-4`}>
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="text-sm text-gray-500">
                                        {tweet.threadPosition}/{threads['thread'].length}
                                      </span>
                                      <a
                                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet.content)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1 text-sm bg-[#1DA1F2] text-white rounded-full hover:bg-[#1a8cd8] transition-colors duration-200"
                                      >
                                        Tweet
                                      </a>
                                    </div>
                                    <p className="text-gray-800 whitespace-pre-wrap">{tweet.content}</p>
                                  </div>
                                </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Display Single Tweets */}
                      {singleTweets.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium text-gray-500">Single Tweets</h3>
                          {singleTweets.map((tweet: any, index: number) => (
                            <div 
                              key={index}
                              className="p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <a
                                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet.content)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1 text-sm bg-[#1DA1F2] text-white rounded-full hover:bg-[#1a8cd8] transition-colors duration-200"
                                >
                                  Tweet
                                </a>
                              </div>
                              <p className="text-gray-800 whitespace-pre-wrap">{tweet.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )
                } catch {
                  return (
                    <textarea
                      id="output"
                      className="w-full h-48 p-4 border rounded-xl shadow-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={outputText}
                      readOnly
                      placeholder="Remixed content will appear here..."
                    />
                  )
                }
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
