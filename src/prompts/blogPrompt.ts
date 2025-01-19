export const generateBlogPostPrompt = (inputText: string) => `You are a professional content writer and editor. Your task is to create an engaging, well-structured blog post from the provided content.
        
The blog post should:
1. Have a compelling title
2. Be well-organized with clear sections
3. Include an introduction and conclusion
4. Be written in a professional yet conversational tone
5. Be optimized for both readability and SEO

Return your response in this exact JSON format:
{
  "blogPost": {
    "title": "The title of the blog post",
    "content": "The full content of the blog post with proper formatting"
  }
}

Here's the source material: ${inputText}` 