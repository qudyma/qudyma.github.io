/**
 * Utility functions for publications page
 * Helper functions for text processing, formatting, and date handling
 */

/**
 * Normalize text by removing accents and diacritics
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
export function normalizeText(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Format author name as "Initials. Surname"
 * @param {string} fullName - Full author name
 * @returns {string} Formatted name
 */
export function formatAuthorAsInitials(fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) return fullName;
    
    // Last part is the surname
    const surname = parts[parts.length - 1];
    
    // Everything else becomes initials
    const initials = parts.slice(0, -1).map(part => {
        // Get first character of each name part
        return part.charAt(0).toUpperCase() + '.';
    }).join(' ');
    
    // Return "Initials. Surname" or just "Surname" if no initials
    return initials ? `${initials} ${surname}` : surname;
}

/**
 * Extract publication year from journal_ref string
 * @param {Object} pub - Publication object
 * @returns {string} Year string or empty
 */
export function getPublicationYear(pub) {
    if (!pub || !pub.journal_ref) return '';
    // Extract year from journal_ref string, e.g., "Phys. Rev. B 112, 134520 (2025)"
    // Match the LAST occurrence of 4 digits in parentheses
    const yearMatches = pub.journal_ref.match(/\((\d{4})\)/g);
    if (yearMatches && yearMatches.length > 0) {
        const lastMatch = yearMatches[yearMatches.length - 1];
        const yearExtract = lastMatch.match(/\((\d{4})\)/);
        if (yearExtract) {
            return yearExtract[1];
        }
    }
    return '';
}

/**
 * Extract publication year for sorting (tries journal_ref first, then published date)
 * @param {Object} pub - Publication object
 * @returns {string} Year string
 */
export function extractPublicationYear(pub) {
    // First try to get year from journal_ref
    if (pub.journal_ref) {
        const yearMatches = pub.journal_ref.match(/\((\d{4})\)/g);
        if (yearMatches && yearMatches.length > 0) {
            const lastMatch = yearMatches[yearMatches.length - 1];
            const yearExtract = lastMatch.match(/\((\d{4})\)/);
            if (yearExtract) {
                return yearExtract[1];
            }
        }
    }
    
    // Fallback to published date year
    if (pub.published) {
        const date = new Date(pub.published);
        return date.getFullYear().toString();
    }
    
    return '';
}

/**
 * Get month-year key for grouping publications
 * @param {Object} pub - Publication object
 * @returns {string} Month-year key
 */
export function getMonthYearKey(pub) {
    const year = getPublicationYear(pub);
    if (!year) return 'Unknown Date';
    return year; // Currently just returning year; could be extended to month-year
}

/**
 * Convert special characters to LaTeX format
 * @param {string} text - Text to convert
 * @returns {string} LaTeX formatted text
 */
export function toLatex(text) {
    if (!text) return text;
    
    const replacements = {
        // Accented vowels - acute
        'á': "\\'a", 'é': "\\'e", 'í': "\\'i", 'ó': "\\'o", 'ú': "\\'u",
        'Á': "\\'A", 'É': "\\'E", 'Í': "\\'I", 'Ó': "\\'O", 'Ú': "\\'U",
        'ý': "\\'y", 'Ý': "\\'Y",
        
        // Accented vowels - grave
        'à': "\\`a", 'è': "\\`e", 'ì': "\\`i", 'ò': "\\`o", 'ù': "\\`u",
        'À': "\\`A", 'È': "\\`E", 'Ì': "\\`I", 'Ò': "\\`O", 'Ù': "\\`U",
        
        // Accented vowels - circumflex
        'â': "\\^a", 'ê': "\\^e", 'î': "\\^i", 'ô': "\\^o", 'û': "\\^u",
        'Â': "\\^A", 'Ê': "\\^E", 'Î': "\\^I", 'Ô': "\\^O", 'Û': "\\^U",
        
        // Accented vowels - umlaut/diaeresis
        'ä': '\\"a', 'ë': '\\"e', 'ï': '\\"i', 'ö': '\\"o', 'ü': '\\"u',
        'Ä': '\\"A', 'Ë': '\\"E', 'Ï': '\\"I', 'Ö': '\\"O', 'Ü': '\\"U',
        'ÿ': '\\"y', 'Ÿ': '\\"Y',
        
        // Accented vowels - tilde
        'ã': '\\~a', 'õ': '\\~o', 'ñ': '\\~n',
        'Ã': '\\~A', 'Õ': '\\~O', 'Ñ': '\\~N',
        
        // Other diacritics
        'ç': '\\c{c}', 'Ç': '\\c{C}',
        'ø': '\\o', 'Ø': '\\O',
        'å': '\\aa', 'Å': '\\AA',
        'æ': '\\ae', 'Æ': '\\AE',
        'œ': '\\oe', 'Œ': '\\OE',
        'ß': '\\ss',
        'ł': '\\l', 'Ł': '\\L',
        
        // Slavic characters
        'š': '\\v{s}', 'Š': '\\v{S}',
        'č': '\\v{c}', 'Č': '\\v{C}',
        'ž': '\\v{z}', 'Ž': '\\v{Z}',
        'ř': '\\v{r}', 'Ř': '\\v{R}',
        'ě': '\\v{e}', 'Ě': '\\v{E}',
        'ů': '\\r{u}', 'Ů': '\\r{U}',
        
        // Polish characters
        'ą': '\\k{a}', 'Ą': '\\k{A}',
        'ę': '\\k{e}', 'Ę': '\\k{E}',
        'ń': "\\'n", 'Ń': "\\'N",
        'ś': "\\'s", 'Ś': "\\'S",
        'ź': "\\'z", 'Ź': "\\'Z",
        'ż': '\\.z', 'Ż': '\\.Z',
        
        // Hungarian characters
        'ő': '\\H{o}', 'Ő': '\\H{O}',
        'ű': '\\H{u}', 'Ű': '\\H{U}',
        
        // Special symbols
        '°': '\\textdegree',
        '€': '\\euro',
        '£': '\\pounds',
        '§': '\\S',
        '¶': '\\P',
        '†': '\\dag',
        '‡': '\\ddag',
        '©': '\\copyright',
        '®': '\\textregistered',
        '™': '\\texttrademark'
    };
    
    let result = text;
    for (const [char, latex] of Object.entries(replacements)) {
        result = result.split(char).join(latex);
    }
    
    return result;
}

/**
 * Update the results counter display
 * @param {number} count - Number of results
 */
export function updateResultsCounter(count) {
    const counter = document.querySelector('.search-results-counter');
    if (counter) {
        counter.textContent = count + ' result' + (count !== 1 ? 's' : '');
    }
}
