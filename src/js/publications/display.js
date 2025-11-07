/**
 * Display module for publications page
 * Handles rendering of preprints and publications lists
 */

import * as state from './state.js';
import { formatAuthorAsInitials, getMonthYearKey, extractPublicationYear } from './utils.js';

/**
 * Format author names with QUDYMA members underlined and linked
 * @param {string} authorsList - Comma-separated list of authors
 * @returns {string} HTML string with formatted authors
 */
function formatAuthors(authorsList) {
    const qudymaAuthorsMap = state.getQudymaAuthorsMap();
    const qudymaAuthorsUrls = state.getQudymaAuthorsUrls();
    
    return authorsList.split(', ').map(author => {
        const authorLower = author.toLowerCase().trim();
        const canonicalName = qudymaAuthorsMap[authorLower];
        
        if (canonicalName) {
            // This is a QUDYMA author - use canonical name
            const url = qudymaAuthorsUrls[authorLower];
            if (url) {
                // QUDYMA author with URL
                return `<u><a href="${url}" style="color: inherit; text-decoration: none !important; border-bottom: none !important;">${canonicalName}</a></u>`;
            } else {
                // QUDYMA author without URL, just underline - no link
                return `<u>${canonicalName}</u>`;
            }
        } else {
            // Non-QUDYMA author - format as initials and link to arXiv search
            const formattedAuthor = formatAuthorAsInitials(author);
            const arxivUrl = `https://arxiv.org/search/?query=${encodeURIComponent(author)}&searchtype=all&abstracts=show&order=-announced_date_first&size=50`;
            return `<a href="${arxivUrl}" style="color: inherit; text-decoration: none !important; border-bottom: none !important;">${formattedAuthor}</a>`;
        }
    }).join(', ');
}

/**
 * Display preprints list
 * @param {Array} preprints - Array of preprint objects (optional, uses state if not provided)
 */
export function displayPreprints(preprints) {
    const container = document.getElementById('publications-container');
    
    // Use filtered preprints from state if not provided
    const preprintsList = preprints || state.getFilteredPreprints();
    
    if (preprintsList.length === 0) {
        container.innerHTML = '<p>No preprints match your search.</p>';
        return;
    }
    
    // Build HTML for each preprint
    const preprintsHtml = preprintsList.map((pub, index) => {
        const authorsFormatted = formatAuthors(pub.authors);
        
        // Extract arXiv ID and create link
        let arxivLink = '';
        let arxivUrl = '';
        if (pub.id) {
            const arxivMatch = pub.id.match(/arxiv\.org\/abs\/(\d+\.\d+)/);
            if (arxivMatch) {
                const arxivCode = arxivMatch[1];
                arxivUrl = pub.arxiv_url || pub.id;
                let arxivYear = '';
                if (pub.published) {
                    const date = new Date(pub.published);
                    arxivYear = date.getFullYear().toString();
                }
                arxivLink = `<a href="${arxivUrl}">arXiv:${arxivCode} (${arxivYear})</a>`;
            }
        }
        
        // Extract submission date
        let submissionDate = '';
        let monthYearKey = '';
        if (pub.published) {
            const date = new Date(pub.published);
            const options = { year: 'numeric', month: 'long' };
            submissionDate = date.toLocaleDateString('en-US', options);
            monthYearKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
        }
        
        // Check if this is a new month/year group
        let monthHeader = '';
        let prevMonthYearKey = '';
        if (index > 0 && preprintsList[index - 1].published) {
            const prevDate = new Date(preprintsList[index - 1].published);
            prevMonthYearKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth()).padStart(2, '0')}`;
        }
        
        if (index === 0 || monthYearKey !== prevMonthYearKey) {
            monthHeader = `
                <span style="font-size: 1.1em; font-weight: bold;">${submissionDate}</span>
                <hr style="margin: 10px 0;">
            `;
        }
        
        return `
            ${monthHeader}
            <p>
                <span style="font-size: 1.2em;"><b><a href="${arxivUrl}" style="color: inherit; text-decoration: none !important; border-bottom: none !important;">${pub.title}</a></b></span>
                <br>
                <span style="font-size: 1.1em;">${authorsFormatted}</span>
                <br>
                ${arxivLink}
            </p>
        `;
    }).join('');
    
    container.innerHTML = preprintsHtml;
    
    // Force scrollbar to stay visible
    const preprintsWrapper = document.getElementById('preprints-scroll-wrapper');
    if (preprintsWrapper) {
        preprintsWrapper.style.overflowY = 'scroll';
    }
}

/**
 * Display publications list
 * @param {Array} publications - Array of publication objects (optional, uses state if not provided)
 */
export function displayPublications(publications) {
    const container = document.getElementById('publications-container');
    
    // Use filtered publications from state if not provided
    const publicationsList = publications || state.getFilteredPublications();
    
    if (publicationsList.length === 0) {
        container.innerHTML = '<p>No publications match your search.</p>';
        return;
    }
    
    // Build HTML for each publication
    const publicationsHtml = publicationsList.map((pub, index) => {
        const authorsFormatted = formatAuthors(pub.authors);
        
        // Create journal link
        let journalLink = '';
        let doiUrl = '';
        if (pub.journal_url) {
            doiUrl = pub.journal_url;
            let displayJournalRef = pub.journal_ref;
            if (!pub.journal_ref.match(/\(\d{4}\)\s*$/)) {
                let publishedYear = '';
                if (pub.published) {
                    const date = new Date(pub.published);
                    publishedYear = date.getFullYear().toString();
                }
                if (publishedYear) {
                    displayJournalRef = `${pub.journal_ref} (${publishedYear})`;
                }
            }
            journalLink = `<a href="${pub.journal_url}" style="color: inherit; ">${displayJournalRef}</a>`;
        } else if (pub.journal_ref) {
            let displayJournalRef = pub.journal_ref;
            if (!pub.journal_ref.match(/\(\d{4}\)\s*$/)) {
                let publishedYear = '';
                if (pub.published) {
                    const date = new Date(pub.published);
                    publishedYear = date.getFullYear().toString();
                }
                if (publishedYear) {
                    displayJournalRef = `${pub.journal_ref} (${publishedYear})`;
                }
            }
            journalLink = displayJournalRef;
        }
        
        // Extract arXiv ID
        let arxivLink = '';
        if (pub.id) {
            const arxivMatch = pub.id.match(/arxiv\.org\/abs\/(\d+\.\d+)/);
            if (arxivMatch) {
                const arxivCode = arxivMatch[1];
                const arxivUrl = pub.arxiv_url || pub.id;
                let arxivYear = '';
                if (pub.published) {
                    const date = new Date(pub.published);
                    arxivYear = date.getFullYear().toString();
                }
                arxivLink = `<a href="${arxivUrl}" style="color: inherit;">arXiv:${arxivCode} (${arxivYear})</a>`;
            }
        }
        
        // Combine journal and arXiv references
        let referencesLine = '';
        if (journalLink && arxivLink) {
            referencesLine = `${journalLink} | ${arxivLink}`;
        } else if (journalLink) {
            referencesLine = journalLink;
        } else if (arxivLink) {
            referencesLine = arxivLink;
        }
        
        // Build awards line
        let awardsLine = '';
        if (pub.awards && Array.isArray(pub.awards) && pub.awards.length > 0) {
            const awardLinks = pub.awards.map(award => {
                if (award.type && award.url) {
                    return `<a href="${award.url}" style="color: inherit;">${award.type}</a>`;
                } else if (award.type) {
                    return award.type;
                }
                return null;
            }).filter(link => link !== null);
            
            if (awardLinks.length > 0) {
                awardsLine = `<br><span style="font-size: 1.1em; font-style: italic;">Awards: ${awardLinks.join(', ')}</span>`;
            }
        }
        
        // Build coverage line
        let coverageLine = '';
        if (pub.coverage && Array.isArray(pub.coverage) && pub.coverage.length > 0) {
            const coverageLinks = pub.coverage.map(coverage => {
                if (coverage.source && coverage.url) {
                    return `<a href="${coverage.url}" style="color: inherit;">${coverage.source}</a>`;
                } else if (coverage.source) {
                    return coverage.source;
                }
                return null;
            }).filter(link => link !== null);
            
            if (coverageLinks.length > 0) {
                coverageLine = `<br><span style="font-size: 1.1em; font-style: italic;">Featured in: ${coverageLinks.join(', ')}</span>`;
            }
        }
        
        // Extract year for grouping
        let yearKey = extractPublicationYear(pub);
        
        // Check if this is a new year group
        let yearHeader = '';
        if (index === 0 || yearKey !== extractPublicationYear(publicationsList[index - 1])) {
            yearHeader = `
                <span style="font-size: 1.1em; font-weight: bold;">${yearKey}</span>
                <hr style="margin: 10px 0;">
            `;
        }
        
        return `
            ${yearHeader}
            <p>
                <span style="font-size: 1.2em;"><b><a href="${doiUrl}" style="color: inherit; text-decoration: none !important; border-bottom: none !important;">${pub.title}</a></b></span>
                <br>
                <span style="font-size: 1.1em;">${authorsFormatted}</span>
                <br>
                ${referencesLine}${awardsLine}${coverageLine}
            </p>
        `;
    }).join('');
    
    container.innerHTML = publicationsHtml;
    
    // Force scrollbar to stay visible
    const publicationsWrapper = document.getElementById('publications-scroll-wrapper');
    if (publicationsWrapper) {
        publicationsWrapper.style.overflowY = 'scroll';
    }
}
