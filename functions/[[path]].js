export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // Only handle HTML files
  if (url.pathname.includes('.') && !url.pathname.endsWith('.html')) {
    // For non-HTML requests, serve the static file
    return context.next();
  }
  
  try {
    // Get the static HTML file
    const response = await context.next();
    
    if (response.status !== 200) {
      return response;
    }
    
    const html = await response.text();
    
    // Inject environment variables into the HTML
    const modifiedHtml = html.replace(
      '</head>',
      `<script>
        window.__ENV__ = {
          FIRECRAWL_API_KEY: "${env.FIRECRAWL_API_KEY || ''}",
          OPENAI_API_KEY: "${env.OPENAI_API_KEY || ''}"
        };
      </script>
      </head>`
    );
    
    return new Response(modifiedHtml, {
      headers: {
        'content-type': 'text/html',
        'cache-control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return context.next();
  }
} 