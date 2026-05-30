export async function translateWord(word, from = 'auto', to = 'ru') {
    try {
        let sourceLang = from;
        if (sourceLang === 'auto') {
            const isRussian = /[а-яё]/i.test(word);
            sourceLang = isRussian ? 'ru' : 'en';
        }
        const res = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${sourceLang}|${to}`
        );
        const data = await res.json();
        if (data.responseStatus === 200) {
            return data.responseData.translatedText;
        }
        return null;
    } catch {
        return null;
    }
}