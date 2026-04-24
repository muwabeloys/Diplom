class ApiClient {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    async request(endpoint, options = {}) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { Authorization: `Bearer ${this.token}` }),
            },
            ...options,
        };

        const response = await fetch(`${this.baseURL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Ошибка запроса');
        }

        return data;
    }

    // Аутентификация
    register = (data) => this.request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
    login = (data) => this.request('/auth/login', { method: 'POST', body: JSON.stringify(data) });
    getProfile = () => this.request('/auth/profile');

    // Слова
    getWordsForStudy = (language = 'en', limit = 10) =>
        this.request(`/words/study?language=${language}&limit=${limit}`);

    reviewWord = (wordId, quality) =>
        this.request(`/words/${wordId}/review`, { method: 'PUT', body: JSON.stringify({ quality }) });

    addWord = (data) =>
        this.request('/words', { method: 'POST', body: JSON.stringify(data) });

    getCategories = (language = 'en') =>
        this.request(`/words/categories?language=${language}`);
}

export const api = new ApiClient();