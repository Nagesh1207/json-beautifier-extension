(async function () {
  try {
    // Re-fetch the raw page text directly from the server as plain text
    // to bypass Chrome's native HTML DOM auto-parsing
    const response = await fetch(window.location.href, {
      headers: { Accept: 'application/json, text/plain, */*' }
    });
    const rawText = (await response.text()).trim();

    // Verify structural JSON boundaries
    if (
      (rawText.startsWith('{') && rawText.endsWith('}')) ||
      (rawText.startsWith('[') && rawText.endsWith(']'))
    ) {
      const jsonObject = JSON.parse(rawText);

      // Wipe Chrome's distorted DOM
      document.documentElement.innerHTML = '<head></head><body></body>';

      // Attach formatted JSON node
      const pre = document.createElement('pre');
      pre.id = 'json-rendered';
      pre.appendChild(buildJsonDom(jsonObject, 0));

      document.body.appendChild(pre);
    }
  } catch (err) {
    // Not valid JSON or endpoint threw a fetch error; leave original page intact
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
