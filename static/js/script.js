const translations = {
    en: '/static/texts/bio_en.txt',
    br: '/static/texts/bio_br.txt'
};

const bio = document.getElementById('bio-text');
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
let justice;
let paragraphs = [];
let layoutFrame;
let bioRequest;
const copyEmail = document.getElementById('copy-email');
const emailStatus = document.getElementById('email-status');

copyEmail.addEventListener('click', async () => {
    const email = copyEmail.dataset.email;
    emailStatus.textContent = '';
    try {
        await navigator.clipboard.writeText(email);
        emailStatus.textContent = bio.lang === 'pt-BR' ? 'Email copiado.' : 'Email copied.';
    } catch (error) {
        // Keep the address selectable when clipboard access is unavailable or denied.
        emailStatus.textContent = bio.lang === 'pt-BR'
            ? `Copie o email: ${email}`
            : `Copy the email address: ${email}`;
    }
});

function scheduleLayout() {
    cancelAnimationFrame(layoutFrame);
    layoutFrame = requestAnimationFrame(layoutBio);
}

function layoutBio() {
    for (const paragraph of paragraphs) {
        const { element, text } = paragraph;
        const style = getComputedStyle(element);
        const width = element.getBoundingClientRect().width;
        const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const key = `${width}:${font}:${style.letterSpacing}:${style.wordSpacing}`;
        if (paragraph.layoutKey === key) continue;
        paragraph.layoutKey = key;

        // Always start with readable native text, including after a resize to mobile.
        element.textContent = text;
        if (!justice || !context || width / parseFloat(style.fontSize) < 30) continue;
        // Respect user styles that override text spacing rather than measuring them incorrectly.
        if (parseFloat(style.letterSpacing) || parseFloat(style.wordSpacing)) continue;

        try {
            if (paragraph.font !== font) {
                context.font = font;
                context.fontKerning = 'none';
                paragraph.prepared = justice.prepare(text, word => context.measureText(word).width);
                // Keep words whole, including source hyphens, so each line is an exact source slice.
                paragraph.prepared.hyphenation = undefined;
                paragraph.font = font;
            }
            const prepared = paragraph.prepared;
            const layout = justice.solve(prepared, width, {
                tracking: 0.3,
                hanging: 0,
                opening: 0,
                shrink: 0.15
            });
            // Prefer native wrapping over a poorly fitted or over-stretched paragraph.
            if (!layout.lines.length || layout.lines.some(line =>
                line.residual < -0.5 || line.wordSpacing > prepared.space
            )) continue;

            const fragment = document.createDocumentFragment();
            layout.lines.forEach((line, index) => {
                const span = document.createElement('span');
                span.className = 'justice-line';
                span.style.wordSpacing = `${line.wordSpacing}px`;
                span.style.letterSpacing = `${line.tracking}px`;
                const start = prepared.starts[line.start];
                const end = prepared.starts[layout.lines[index + 1]?.start] ?? text.length;
                // Retain source spaces for selection, copying, and assistive technology.
                span.textContent = text.slice(start, end);
                fragment.append(span);
            });
            element.replaceChildren(fragment);
            if ([...element.children].some(line => line.scrollWidth > width + 1)) {
                element.textContent = text;
            }
        } catch (error) {
            element.textContent = text;
            console.warn('Using native biography wrapping:', error);
        }
    }
}

function invalidateLayout() {
    for (const paragraph of paragraphs) {
        paragraph.layoutKey = null;
        paragraph.font = null;
    }
    scheduleLayout();
}

async function fetchBio(language) {
    bioRequest?.abort();
    const request = new AbortController();
    bioRequest = request;
    try {
        const response = await fetch(translations[language], { signal: request.signal });
        if (!response.ok) throw new Error(`Biography request failed: ${response.status}`);
        const text = await response.text();
        if (request.signal.aborted) return;
        paragraphs = text.trim().split(/\r?\n\s*\r?\n/).map(text => {
            const element = document.createElement('p');
            text = text.replace(/\s+/g, ' ').trim();
            element.textContent = text;
            return { element, text };
        });
        bio.replaceChildren(...paragraphs.map(paragraph => paragraph.element));
        bio.lang = language === 'br' ? 'pt-BR' : 'en';
        document.documentElement.lang = bio.lang;
        copyEmail.setAttribute('aria-label',
            language === 'br' ? 'Copiar endereço de email' : 'Copy email address');
        emailStatus.textContent = '';
        document.querySelector('.toggle-language').setAttribute('aria-label',
            language === 'br' ? 'Idioma da biografia' : 'Biography language');
        document.getElementById('links').setAttribute('aria-label',
            language === 'br' ? 'Contato e perfis de pesquisa' : 'Contact and research profiles');
        for (const code of Object.keys(translations)) {
            document.getElementById(`toggle-language-${code}`)
                .setAttribute('aria-pressed', String(code === language));
        }
        scheduleLayout();
    } catch (error) {
        if (error.name === 'AbortError') return;
        console.error('Error fetching bio:', error);
        // Retain the current biography if a subsequent language request fails.
        if (!paragraphs.length) bio.textContent = 'Unable to load the biography. Please refresh to try again.';
    }
}

// Progressive enhancement: a failed import leaves the biography and controls usable.
import('./vendor/justice/engine.js')
    .then(engine => {
        justice = engine;
        invalidateLayout();
    })
    .catch(error => console.warn('Justice unavailable; using native biography wrapping:', error));

if ('ResizeObserver' in window) {
    new ResizeObserver(scheduleLayout).observe(bio);
} else {
    window.addEventListener('resize', scheduleLayout);
}
document.fonts?.ready.then(invalidateLayout);
document.fonts?.addEventListener('loadingdone', invalidateLayout);

for (const language of Object.keys(translations)) {
    document.getElementById(`toggle-language-${language}`)
        .addEventListener('click', () => fetchBio(language));
}

fetchBio('en');
