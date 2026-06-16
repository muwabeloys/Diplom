export async function translateWord(word, from = 'auto', to = 'ru') {
    try {
        let sourceLang = from;
        let targetLang = to;

        if (sourceLang === 'auto') {
            const isRussian = /[а-яё]/i.test(word);
            if (isRussian) {
                sourceLang = 'ru';
                targetLang = 'en';  // русский → английский
            } else {
                sourceLang = 'en';
                targetLang = 'ru';  // английский → русский
            }
        }

        const res = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${sourceLang}|${targetLang}`
        );
        const data = await res.json();

        if (data.responseStatus === 200 && data.responseData?.translatedText) {
            return data.responseData.translatedText;
        }
        return null;
    } catch {
        return null;
    }
}