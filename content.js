(function () {
  function formatJsonPage() {
    // 1. Skip standard web pages (e.g., Bitbucket) that have multiple DOM elements
    if (document.body && document.body.children.length > 1) {
      return;
    }

    // 2. Extract raw text directly from the DOM
    const preElement = document.querySelector('pre');
    const rawText = (
      preElement ? preElement.textContent : (document.body ? document.body.textContent : '')
    ).trim();

    renderJson(rawText);
  }

  function looksLikeJson(text) {
    return (
      (text.startsWith('{') && text.endsWith('}')) ||
      (text.startsWith('[') && text.endsWith(']'))
    );
  }

  // Renders the text as formatted JSON; returns false if it is not valid JSON/JSONP
  function renderJson(rawText) {
    rawText = rawText.trim();

    // Extract inner JSON if payload is JSONP (e.g., callback_NativeAds({...});)
    let isJsonp = false;
    let jsonpPrefix = '';
    let jsonpSuffix = '';

    const jsonpMatch = rawText.match(/^([a-zA-Z0-9_$.]+)\s*\(([\s\S]*)\)\s*;?$/);
    if (jsonpMatch) {
      isJsonp = true;
      jsonpPrefix = jsonpMatch[1] + '(';
      jsonpSuffix = ');';
      rawText = jsonpMatch[2].trim(); // Extract purely the inner JSON string
    }

    // Verify valid JSON boundaries
    if (!looksLikeJson(rawText)) {
      return false;
    }

    let jsonObject;
    try {
      jsonObject = JSON.parse(rawText);
    } catch (err) {
      return false;
    }

    // Clear existing unformatted document
    document.body.innerHTML = '';

    const pre = document.createElement('pre');
    pre.id = 'json-rendered';

    // Re-attach JSONP wrapper prefix if applicable
    if (isJsonp) {
      const prefixSpan = document.createElement('span');
      prefixSpan.style.color = '#dcdcaa'; // Yellow function call highlight
      prefixSpan.textContent = jsonpPrefix + '\n';
      pre.appendChild(prefixSpan);
    }

    // Render color-coded DOM tree
    pre.appendChild(buildJsonDom(jsonObject, isJsonp ? 1 : 0));

    // Re-attach JSONP wrapper suffix if applicable
    if (isJsonp) {
      const suffixSpan = document.createElement('span');
      suffixSpan.style.color = '#dcdcaa';
      suffixSpan.textContent = '\n' + jsonpSuffix;
      pre.appendChild(suffixSpan);
    }

    document.body.appendChild(pre);
    return true;
  }

  // Ensure DOM is parsed before extracting content
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', formatJsonPage);
  } else {
    formatJsonPage();
  }

  function buildJsonDom(obj, indentLevel = 0) {
    const indent = '  '.repeat(indentLevel);
    const fragment = document.createDocumentFragment();

    if (obj === null) {
      const span = document.createElement('span');
      span.className = 'json-null';
      span.textContent = 'null';
      fragment.appendChild(span);
    } else if (typeof obj === 'boolean') {
      const span = document.createElement('span');
      span.className = 'json-boolean';
      span.textContent = String(obj);
      fragment.appendChild(span);
    } else if (typeof obj === 'number') {
      const span = document.createElement('span');
      span.className = 'json-number';
      span.textContent = String(obj);
      fragment.appendChild(span);
    } else if (typeof obj === 'string') {
      const span = document.createElement('span');
      span.className = 'json-string';
      span.textContent = JSON.stringify(obj);
      fragment.appendChild(span);
    } else if (Array.isArray(obj)) {
      if (obj.length === 0) {
        fragment.appendChild(document.createTextNode('[]'));
      } else {
        fragment.appendChild(document.createTextNode('[\n'));
        obj.forEach((item, index) => {
          fragment.appendChild(document.createTextNode('  '.repeat(indentLevel + 1)));
          fragment.appendChild(buildJsonDom(item, indentLevel + 1));
          if (index < obj.length - 1) {
            fragment.appendChild(document.createTextNode(','));
          }
          fragment.appendChild(document.createTextNode('\n'));
        });
        fragment.appendChild(document.createTextNode(indent + ']'));
      }
    } else if (typeof obj === 'object') {
      const keys = Object.keys(obj);
      if (keys.length === 0) {
        fragment.appendChild(document.createTextNode('{}'));
      } else {
        fragment.appendChild(document.createTextNode('{\n'));
        keys.forEach((key, index) => {
          fragment.appendChild(document.createTextNode('  '.repeat(indentLevel + 1)));

          const keySpan = document.createElement('span');
          keySpan.className = 'json-key';
          keySpan.textContent = JSON.stringify(key) + ': ';
          fragment.appendChild(keySpan);

          fragment.appendChild(buildJsonDom(obj[key], indentLevel + 1));

          if (index < keys.length - 1) {
            fragment.appendChild(document.createTextNode(','));
          }
          fragment.appendChild(document.createTextNode('\n'));
        });
        fragment.appendChild(document.createTextNode(indent + '}'));
      }
    }

    return fragment;
  }
})();
