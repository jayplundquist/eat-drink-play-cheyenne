import { useEffect } from 'react';

const SITE_NAME = 'Eat, Drink, Play Cheyenne';
const DEFAULT_DESC = 'Find restaurants, bars, breweries, events, Greenway trails, and things to do in Cheyenne, Wyoming.';

/**
 * Centralized SEO hook — sets document title, meta description, robots
 * (index/noindex), Open Graph tags, and optional JSON-LD structured data.
 * Cleans up JSON-LD on unmount so stale structured data doesn't leak
 * between pages.
 */
export function useSEO({ title, description, noindex = false, jsonLd = null, jsonLdId = 'page-jsonld' }) {
  useEffect(() => {
    const fullTitle = title || `${SITE_NAME} — ${DEFAULT_DESC}`;
    document.title = fullTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description || DEFAULT_DESC);

    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute('content', noindex ? 'noindex, nofollow' : 'index, follow');

    setOgTag('og:title', fullTitle);
    setOgTag('og:description', description || DEFAULT_DESC);
    setOgTag('og:type', 'website');

    let scriptTag = document.getElementById(jsonLdId);
    if (jsonLd) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = jsonLdId;
        scriptTag.setAttribute('type', 'application/ld+json');
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(jsonLd);
    } else if (scriptTag) {
      scriptTag.remove();
    }

    return () => {
      if (jsonLd && scriptTag) {
        scriptTag.remove();
      }
    };
  }, [title, description, noindex, jsonLd, jsonLdId]);
}

function setOgTag(property, content) {
  let tag = document.querySelector(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('property', property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}