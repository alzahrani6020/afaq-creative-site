export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const target = new URL(url.pathname + url.search, 'https://228ccfa3.afaq-creative.pages.dev');
    
    const modifiedHeaders = new Headers(request.headers);
    modifiedHeaders.set('Host', '228ccfa3.afaq-creative.pages.dev');
    
    const response = await fetch(target, {
      method: request.method,
      headers: modifiedHeaders,
      body: request.body,
    });
    
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-Proxy-By', 'Afaq-Worker');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
