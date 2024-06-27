const translations = {
    en: '/static/texts/bio_en.txt',
    br: '/static/texts/bio_br.txt'
};

function fetchBio(language) {
    fetch(translations[language])
        .then(response => response.text())
        .then(text => {
            document.getElementById('bio-text').innerText = text;
        })
        .catch(error => {
            console.error('Error fetching bio:', error);
            document.getElementById('bio-text').innerText = 'Error loading bio.';
        });
}

document.getElementById('theme-toggle').addEventListener('change', () => {
    const body = document.body;
    body.classList.toggle('dark-mode');
    body.classList.toggle('light-mode');
});

document.getElementById('toggle-language-en').addEventListener('click', () => {
    fetchBio('en');
});

document.getElementById('toggle-language-br').addEventListener('click', () => {
    fetchBio('br');
});

// Load the default bio (English) on page load
fetchBio('en');
