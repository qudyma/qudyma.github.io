/**
 * Utility Functions Module
 * Shared helper functions used across the publications system
 */

/**
 * Normalize text by removing accents and diacritics
 */
export function normalizeText(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Format author name as initials (e.g., "John Smith" -> "J. Smith")
 */
export function formatAuthorAsInitials(fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return fullName;
    
    const lastNames = [];
    const firstNames = [];
    
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part.match(/^[A-Z][a-z]/)) {
            firstNames.push(part);
        } else if (part.match(/^[A-Z]/)) {
            if (i < parts.length - 1) {
                firstNames.push(part);
            } else {
                lastNames.push(part);
            }
        } else {
            lastNames.push(part);
        }
    }
    
    if (lastNames.length === 0) {
        lastNames.push(parts[parts.length - 1]);
        firstNames.pop();
    }
    
    const initials = firstNames.map(name => {
        if (name.length === 1) return name + '.';
        const firstChar = name.charAt(0);
        if (name.length > 1 && name.charAt(1).match(/[a-z]/)) {
            return firstChar + '.';
        }
        return name;
    }).join(' ');
    
    return initials + ' ' + lastNames.join(' ');
}

/**
 * Extract publication year from various fields
 */
export function extractPublicationYear(pub) {
    if (pub.journal_ref) {
        const match = pub.journal_ref.match(/\((\d{4})\)/);
        if (match) return match[1];
        
        const yearMatch = pub.journal_ref.match(/\b(\d{4})\b/);
        if (yearMatch) return yearMatch[1];
    }
    
    if (pub.published) {
        return pub.published.substring(0, 4);
    }
    
    return 'Unknown';
}

/**
 * Get month and year key for grouping
 */
export function getMonthYearKey(pub) {
    const publishedDate = new Date(pub.published);
    const month = publishedDate.toLocaleString('default', { month: 'long' });
    const year = publishedDate.getFullYear();
    return `${month} ${year}`;
}

/**
 * Get publication year (wrapper for compatibility)
 */
export function getPublicationYear(pub) {
    const year = extractPublicationYear(pub);
    const numericYear = parseInt(year);
    if (!isNaN(numericYear) && numericYear >= 1900 && numericYear <= 2100) {
        return numericYear;
    }
    if (pub.published) {
        return parseInt(pub.published.substring(0, 4));
    }
    return 2020;
}
