// const { ApiError } = require('../../../backend/utils/ApiError.utils.js');

export async function fetchWithCache(cacheKey, url, options = {}) {
    try {
        const response = await fetch(url, options);
        if(!response.ok){
            throw new Error("Server errro - cache utils code");
        }

        const data = await response.json();
        localStorage.setItem(cacheKey, JSON.stringify(data));
        return {data: data, isStale: false}
    } catch (error) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
        return { data: JSON.parse(cached), isStale: true };   // fail pe purana data, flag ke sath
        }
        return { data: null, isStale: false }; 
    }
}

// module.exports = fetchWithCache;