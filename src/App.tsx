import { useState, useEffect, ChangeEvent } from 'react'
import { createClient } from '@supabase/supabase-js'
import { generateTweetsPrompt, generateBlogPostPrompt } from './prompts'
import { fetchTweet } from './utils/twitter'
import { API_BASE_URL } from './utils/config'
import { 
  PencilSquareIcon, 
  TrashIcon,
  BookmarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

// Custom X (Twitter) icon component
const XIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// Create a custom hook for Supabase
const useSupabase = () => {
  const [supabase] = useState(() => 
    createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    )
  );

  useEffect(() => {
    // Test Supabase connection
    supabase.from('saved_tweets').select('count', { count: 'exact', head: true })
      .then(({ error }) => {
        if (error) {
          console.error('Supabase connection error:', error)
        } else {
          console.log('Supabase connected successfully')
        }
      })
  }, [supabase]);

  return supabase;
}

interface SavedContent {
  id?: number
  content: string
  isThread: boolean
  threadPosition: number | null
  created_at?: string
  title?: string
}

// Add new Tweet interface
interface Tweet {
  content: string
  isThread: boolean
  threadPosition: number | null
}

// Add TweetDisplay component
const TweetDisplay = ({ 
  tweets,
  onSave
}: { 
  tweets: Tweet[]
  onSave: (content: SavedContent) => Promise<void>
}) => {
  const handleTweet = (content: string) => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}`;
    window.open(twitterUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      {tweets.map((tweet, index) => (
        <div key={index} className="bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
          <p className="text-gray-100">{tweet.content}</p>
          {tweet.isThread && (
            <p className="text-sm text-gray-400 mt-2">
              Thread position: {tweet.threadPosition}
            </p>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => handleTweet(tweet.content)}
              className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              title="Tweet this"
            >
              <XIcon />
            </button>
            <button
              onClick={() => {
                const content: SavedContent = {
                  content: tweet.content,
                  isThread: tweet.isThread,
                  threadPosition: tweet.threadPosition
                };
                onSave(content);
              }}
              className="p-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700"
              title="Save tweet"
            >
              <BookmarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Add RightSidebar component
const RightSidebar = ({
  isOpen,
  onToggle,
  savedItems,
  onDelete,
  editingItemId,
  setEditingItemId,
  editingContent,
  setEditingContent,
  onUpdate,
  handleTweet
}: {
  isOpen: boolean
  onToggle: () => void
  savedItems: SavedContent[]
  onDelete: (id: number) => Promise<void>
  editingItemId: number | null
  setEditingItemId: (id: number | null) => void
  editingContent: string
  setEditingContent: (content: string) => void
  onUpdate: (id: number, content: string) => Promise<void>
  handleTweet: (content: string) => void
}) => {
  return (
    <div className={`fixed top-0 right-0 h-full bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} z-50`}>
      <div className="relative w-80 h-full">
        <button
          onClick={onToggle}
          className="absolute -left-8 top-4 bg-gray-800 p-1 rounded-l-md shadow-md"
        >
          {isOpen ? (
            <ChevronRightIcon className="w-6 h-6 text-gray-300" />
          ) : (
            <ChevronLeftIcon className="w-6 h-6 text-gray-300" />
          )}
        </button>
        
        <div className="h-full overflow-y-auto p-4">
          <h2 className="text-xl font-semibold mb-4 text-white">Saved Items</h2>
          <div className="space-y-4">
            {savedItems.map((item) => (
              <div key={item.id} className="bg-gray-700 p-4 rounded-lg shadow border border-gray-600">
                {editingItemId === item.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="w-full p-2 border rounded bg-gray-800 text-gray-100 border-gray-600"
                      rows={4}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingItemId(null)
                          setEditingContent('')
                        }}
                        className="px-3 py-1 text-sm rounded bg-gray-600 text-gray-200 hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => onUpdate(item.id!, editingContent)}
                        className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-100">{item.content}</p>
                    {item.isThread && (
                      <p className="text-sm text-gray-400 mt-2">
                        Thread position: {item.threadPosition}
                      </p>
                    )}
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        onClick={() => handleTweet(item.content)}
                        className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        title="Tweet this"
                      >
                        <XIcon />
                      </button>
                      <button
                        onClick={() => {
                          setEditingItemId(item.id!)
                          setEditingContent(item.content)
                        }}
                        className="p-1.5 rounded-lg bg-gray-600 text-gray-300 hover:bg-gray-500"
                        title="Edit"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(item.id!)}
                        className="p-1.5 rounded-lg bg-red-900 text-red-200 hover:bg-red-800"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [inputType, setInputType] = useState<'text' | 'pdf' | 'tweet'>('text')
  const [outputType, setOutputType] = useState<'tweets' | 'blog'>('tweets')
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [savedItems, setSavedItems] = useState<SavedContent[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true)

  const supabase = useSupabase()

  const handleTweet = (content: string) => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}`;
    window.open(twitterUrl, '_blank');
  };

  // Fetch saved items on component mount
  useEffect(() => {
    fetchSavedItems()
  }, [])

  const fetchSavedItems = async () => {
    console.log('Fetching saved items...')
    const { data, error } = await supabase
      .from('saved_tweets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching saved items:', error)
      return
    }

    console.log('Fetched saved items:', data)
    setSavedItems(data || [])
  }

  const handleSaveItem = async (content: SavedContent) => {
    setIsSaving(true)
    try {
      console.log('Attempting to save item:', content)
      const { data, error } = await supabase
        .from('saved_tweets')
        .insert([{
          content: content.content,
          is_thread: content.isThread,
          thread_position: content.threadPosition,
          title: content.title
        }])
        .select()

      if (error) {
        console.error('Detailed save error:', error)
        throw error
      }

      console.log('Item saved successfully:', data)
      await fetchSavedItems()
    } catch (error) {
      console.error('Error saving item:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSavedItem = async (id: number) => {
    try {
      const { error } = await supabase
        .from('saved_tweets')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchSavedItems()
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  const handleUpdateItem = async (id: number, newContent: string) => {
    try {
      const { error } = await supabase
        .from('saved_tweets')
        .update({ content: newContent })
        .eq('id', id)

      if (error) throw error

      setEditingItemId(null)
      setEditingContent('')
      await fetchSavedItems()
    } catch (error) {
      console.error('Error updating item:', error)
    }
  }

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsLoading(true)

      // Convert file to base64
      const base64File = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = reader.result as string
          resolve(base64.split(',')[1]) // Remove data URL prefix
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Send file to backend for processing
      const response = await fetch(`${API_BASE_URL}/api/process-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ base64File })
      })

      if (!response.ok) {
        throw new Error('Failed to process PDF')
      }

      const data = await response.json()
      setInputText(data.result)
    } catch (error) {
      console.error('Error processing PDF:', error)
      setInputText('Error processing PDF file')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTweetUrlInput = async (url: string) => {
    try {
      // Remove any @ symbol from the beginning of the URL
      const cleanUrl = url.replace(/^@/, '')
      
      // Extract tweet ID from URL - handle both twitter.com and x.com URLs
      const tweetIdMatch = cleanUrl.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/)
      const tweetId = tweetIdMatch?.[1]

      if (!tweetId) {
        setInputText('Invalid Tweet URL. Please provide a URL in the format: https://x.com/username/status/123456789')
        return
      }

      setIsLoading(true)
      const tweetContent = await fetchTweet(tweetId)
      setInputText(tweetContent)
    } catch (error) {
      console.error('Error fetching tweet:', error)
      setInputText('Error fetching tweet. Please make sure the URL is correct and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemix = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/remix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputText,
          outputType
        })
      })

      if (!response.ok) {
        throw new Error('Failed to process content')
      }

      const { result } = await response.json()
      
      try {
        const parsedResponse = JSON.parse(result)
        // Validate response format
        if (outputType === 'tweets' && Array.isArray(parsedResponse?.tweets)) {
          setOutputText(result)
        } else if (outputType === 'blog' && parsedResponse?.blogPost?.title && parsedResponse?.blogPost?.content) {
          setOutputText(result)
        } else {
          setOutputText('Error: Response format does not match expected schema')
        }
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
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white">Content Remixer</h1>
            <p className="mt-2 text-lg text-gray-300">Transform your content into tweets or blog posts</p>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
            {/* Input Type Selection */}
            <div className="flex gap-4">
              <button
                onClick={() => setInputType('text')}
                className={`px-4 py-2 rounded-lg ${inputType === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                Text
              </button>
              <button
                onClick={() => setInputType('pdf')}
                className={`px-4 py-2 rounded-lg ${inputType === 'pdf' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                PDF
              </button>
              <button
                onClick={() => setInputType('tweet')}
                className={`px-4 py-2 rounded-lg ${inputType === 'tweet' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                Tweet URL
              </button>
            </div>

            {/* Output Type Selection */}
            <div className="flex gap-4">
              <button
                onClick={() => setOutputType('tweets')}
                className={`px-4 py-2 rounded-lg ${outputType === 'tweets' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                Generate Tweets
              </button>
              <button
                onClick={() => setOutputType('blog')}
                className={`px-4 py-2 rounded-lg ${outputType === 'blog' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                Generate Blog Post
              </button>
            </div>

            {/* Input Section */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-300">
                Input {inputType === 'text' ? 'Text' : inputType === 'pdf' ? 'PDF' : 'Tweet URL'}
              </label>
              
              {inputType === 'text' && (
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full h-40 p-3 border rounded-lg bg-gray-700 text-gray-100 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter your text here..."
                />
              )}
              
              {inputType === 'pdf' && (
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="w-full p-2 border rounded-lg bg-gray-700 text-gray-100 border-gray-600 file:bg-gray-600 file:text-gray-100 file:border-0 file:rounded-lg file:px-4 file:py-2 hover:file:bg-gray-500"
                />
              )}
              
              {inputType === 'tweet' && (
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onBlur={(e) => handleTweetUrlInput(e.target.value)}
                  className="w-full p-3 border rounded-lg bg-gray-700 text-gray-100 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Paste tweet URL here..."
                />
              )}
            </div>

            {/* Remix Button */}
            <button
              onClick={handleRemix}
              disabled={isLoading || !inputText}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium ${
                isLoading || !inputText
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Processing...' : 'Remix Content'}
            </button>

            {/* Output Section with Save Button */}
            {outputText && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-300">
                    Output
                  </label>
                  <button
                    onClick={() => {
                      let content: SavedContent
                      try {
                        const parsed = JSON.parse(outputText)
                        content = {
                          content: outputText,
                          isThread: outputType === 'tweets',
                          threadPosition: null,
                          title: outputType === 'blog' ? parsed.blogPost?.title : undefined
                        }
                      } catch {
                        content = {
                          content: outputText,
                          isThread: outputType === 'tweets',
                          threadPosition: null
                        }
                      }
                      handleSaveItem(content)
                    }}
                    disabled={isSaving}
                    className={`px-4 py-2 rounded-lg ${
                      isSaving
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {isSaving ? 'Saving...' : 'Save Output'}
                  </button>
                </div>
                <div className="w-full min-h-40 p-4 bg-gray-700 rounded-lg text-gray-100">
                  {(() => {
                    try {
                      const parsed = JSON.parse(outputText);
                      if (outputType === 'tweets' && Array.isArray(parsed?.tweets)) {
                        return <TweetDisplay tweets={parsed.tweets} onSave={handleSaveItem} />;
                      } else if (outputType === 'blog' && parsed?.blogPost?.title && parsed?.blogPost?.content) {
                        return (
                          <div>
                            <h2 className="text-2xl font-bold mb-4 text-white">{parsed.blogPost.title}</h2>
                            <div className="prose prose-invert">{parsed.blogPost.content}</div>
                          </div>
                        );
                      }
                    } catch (error) {
                      return <pre className="whitespace-pre-wrap text-gray-100">{outputText}</pre>;
                    }
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <RightSidebar
        isOpen={isRightSidebarOpen}
        onToggle={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
        savedItems={savedItems}
        onDelete={handleDeleteSavedItem}
        editingItemId={editingItemId}
        setEditingItemId={setEditingItemId}
        editingContent={editingContent}
        setEditingContent={setEditingContent}
        onUpdate={handleUpdateItem}
        handleTweet={handleTweet}
      />
    </div>
  )
}

export default App
