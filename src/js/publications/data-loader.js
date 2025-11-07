/**
 * Data Loading Module
 * Handles fetching publications and author data from GitHub
 */

// Cache timestamps for better performance
const basicsTimestamp = Math.floor(Date.now() / (1000 * 60 * 60 * 6)); // 6 hours
const publicationsTimestamp = Math.floor(Date.now() / (1000 * 60 * 60)); // 1 hour

/**
 * Load author configuration from basics.json
 */
export async function loadAuthorsConfig() {
    const configUrl = `https://raw.githubusercontent.com/qudyma/qudyma_db/main/config/basics.json?v=${basicsTimestamp}`;
    const response = await fetch(configUrl);
    
    if (!response.ok) {
        throw new Error(`Failed to fetch QUDYMA members config: ${response.status}`);
    }
    
    return await response.json();
}

/**
 * Load publications database from publications.json
 */
export async function loadPublications() {
    const dbUrl = `https://raw.githubusercontent.com/qudyma/qudyma_db/main/data/publications.json?v=${publicationsTimestamp}`;
    const response = await fetch(dbUrl);
    
    if (!response.ok) {
        throw new Error(`Failed to fetch publications database: ${response.status}`);
    }
    
    const data = await response.json();
    return data.entries || [];
}

/**
 * Calculate minimum year from publications
 */
export function calculateMinYear(publications) {
    const years = publications
        .map(pub => {
            if (pub.published) {
                return parseInt(pub.published.substring(0, 4));
            }
            return null;
        })
        .filter(year => year !== null);
    
    return years.length > 0 ? Math.min(...years) : 2020;
}
