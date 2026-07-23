// Server-side / Client-side Wikipedia API helper

export async function fetchWikipediaSummary(title: string) {
  try {
    // Wikipedia API requires URL-encoded title. We search for the exact title, and title + (TV series)
    const encodedTitle = encodeURIComponent(title);
    let url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodedTitle}&format=json&origin=*`;
    
    let res = await fetch(url);
    if (!res.ok) return null;
    let data = await res.json();
    let pages = data?.query?.pages;
    let pageId = Object.keys(pages || {})[0];
    
    // If not found or missing, try appending (TV series) or (film)
    if (!pageId || pageId === '-1' || !pages[pageId].extract) {
      const tvUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(title + ' (TV series)')}&format=json&origin=*`;
      res = await fetch(tvUrl);
      if (res.ok) {
        data = await res.json();
        pages = data?.query?.pages;
        pageId = Object.keys(pages || {})[0];
      }
    }
    
    if (pageId && pageId !== '-1' && pages[pageId].extract) {
      return pages[pageId].extract.split('\n')[0]; // Return just the first paragraph
    }
    
    return null;
  } catch (error) {
    console.error("Wikipedia API Error:", error);
    return null;
  }
}
