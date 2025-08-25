/* video.js — robust YouTube + MP4, UE-friendly */

function embedYoutube(url, autoplay, background) {
  const usp = new URLSearchParams(url.search);
  let suffix = '';
  if (background || autoplay) {
    const suffixParams = {
      autoplay: autoplay ? '1' : '0',
      mute: background ? '1' : '0',
      controls: background ? '0' : '1',
      disablekb: background ? '1' : '0',
      loop: background ? '1' : '0',
      playsinline: background ? '1' : '0',
    };
    suffix = `&${Object.entries(suffixParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
  }

  let vid = '';
  // watch?v=ID
  if (usp.get('v')) vid = encodeURIComponent(usp.get('v'));

  // youtu.be/ID
  if (!vid && url.origin.includes('youtu.be')) {
    const parts = url.pathname.split('/').filter(Boolean);
    vid = parts[0] ? encodeURIComponent(parts[0]) : '';
  }

  // already /embed/ID
  const isEmbed = url.pathname.startsWith('/embed/');

  const embedSrc = isEmbed
    ? `https://www.youtube.com${url.pathname}${url.search || ''}${suffix}`
    : `https://www.youtube.com/${vid ? `embed/${vid}?rel=0&v=${vid}${suffix}` : `embed${url.pathname}${suffix}`}`;

  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  wrapper.style.width = '100%';
  wrapper.style.height = '0';
  wrapper.style.paddingBottom = '56.25%'; // 16:9

  const iframe = document.createElement('iframe');
  iframe.src = embedSrc;
  iframe.title = 'YouTube video';
  iframe.loading = 'lazy';
  iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope; picture-in-picture';
  iframe.allowFullscreen = true;
  Object.assign(iframe.style, {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0,
  });

  wrapper.append(iframe);
  return wrapper;
}

function getVideoElement(source, autoplay, background) {
  const video = document.createElement('video');
  video.setAttribute('controls', '');
  if (autoplay) video.setAttribute('autoplay', '');
  if (background) {
    video.setAttribute('loop', '');
    video.setAttribute('playsinline', '');
    video.removeAttribute('controls');
    video.addEventListener('canplay', () => {
      video.muted = true;
      if (autoplay) video.play();
    });
  }
  const sourceEl = document.createElement('source');
  sourceEl.src = source;
  sourceEl.type = 'video/mp4';
  video.append(sourceEl);
  return video;
}

function normalizeUrl(str) {
  if (!str) return '';
  const s = str.trim();
  if (!s) return '';
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('//')) return `https:${s}`;
  if (s.startsWith('www.')) return `https://${s}`;
  return s;
}

function extractUrl(block) {
  // UE rich-text field (either flavor)
  const rt =
    block.querySelector('[data-rich-text="videoUrl"]') ||
    block.querySelector('[data-aue-prop="videoUrl"]');

  if (rt) {
    const a = rt.querySelector('a[href]');
    return normalizeUrl(a ? a.href : rt.textContent);
  }

  // Fallback: any <a>
  const a = block.querySelector('a[href]');
  if (a) return normalizeUrl(a.href);

  // Last resort: any text
  return normalizeUrl(block.textContent);
}

function loadVideoEmbed(block, link, autoplay, background) {
  const lc = link.toLowerCase();
  const isYoutube = lc.includes('youtube.com') || lc.includes('youtu.be');

  if (isYoutube) {
    const url = new URL(link);
    const embedWrapper = embedYoutube(url, autoplay, background);
    block.append(embedWrapper);
    embedWrapper.querySelector('iframe').addEventListener('load', () => {
      block.dataset.embedLoaded = 'true';
    });
  } else {
    // Assume direct/DM MP4 (or compatible)
    const videoEl = getVideoElement(link, autoplay, background);
    block.append(videoEl);
    videoEl.addEventListener('canplay', () => {
      block.dataset.embedLoaded = 'true';
    });
  }
}

export default function decorate(block) {
  // Read before we touch the DOM
  const url = extractUrl(block);
  // Clear, but keep a hidden field so UE form editing still works
  block.innerHTML = '';

  // Preserve a hidden editable node for UE (so the form field keeps working)
  const hidden = document.createElement('p');
  hidden.dataset.richText = 'videoUrl';
  hidden.textContent = url || '';
  hidden.style.display = 'none';
  block.append(hidden);

  block.dataset.embedLoaded = 'false';

  const autoplayBg = block.classList.contains('autoplay'); // background-style playback
  const playOnLoad = block.classList.contains('playonload'); // start immediately
  const shouldAutoplay = autoplayBg || playOnLoad;

  if (url) {
    try {
      loadVideoEmbed(block, url, shouldAutoplay, autoplayBg);
    } catch (e) {
      // Minimal author-visible error
      const err = document.createElement('p');
      err.textContent = 'Unable to load video. Please check the URL.';
      block.append(err);
    }
  } else {
    const ph = document.createElement('p');
    ph.textContent = 'Add a Video URL in the side panel.';
    block.append(ph);
  }
}
