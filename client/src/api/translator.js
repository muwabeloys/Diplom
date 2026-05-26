export async function translateWord(word, from = 'en', to = 'ru') {
    try {
        const res = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${from}|${to}`
        );
        const data = await res.json();
        if (data.responseStatus === 200) {
            return {
                translation: data.responseData.translatedText,
                match: data.responseData.match
            };
        }
        return null;
    } catch {
        return null;
    }
}