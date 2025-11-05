// Global variables to store data
let allPreprints = [];
let allPublications = [];
let qudymaAuthorsMap = {};
let qudymaAuthorsUrls = {};

// Load and display preprints (publications without journal_ref)
async function loadPreprints() {
    try {
        // First, fetch the QUDYMA members config
        const configUrl = 'https://raw.githubusercontent.com/qudyma/qudyma_db/main/config/basics.json';
        const configResponse = await fetch(configUrl);
        
        if (!configResponse.ok) {
            throw new Error(`Failed to fetch QUDYMA members config: ${configResponse.status}`);
        }
        
        const configData = await configResponse.json();
        
        // Extract QUDYMA author names and their variants
        Object.values(configData).forEach(member => {
            if (member.name) {
                qudymaAuthorsMap[member.name.toLowerCase()] = true;
                if (member.url) {
                    qudymaAuthorsUrls[member.name.toLowerCase()] = member.url;
                }
                
                // Also add name variants
                if (member.name_variants) {
                    member.name_variants.forEach(variant => {
                        qudymaAuthorsMap[variant.toLowerCase()] = true;
                        if (member.url) {
                            qudymaAuthorsUrls[variant.toLowerCase()] = member.url;
                        }
                    });
                }
            }
        });
        
        // Now fetch the publications database
        const dbUrl = 'https://raw.githubusercontent.com/qudyma/qudyma_db/main/data/publications.json';
        const response = await fetch(dbUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch publications database: ${response.status}`);
        }
        
        // Parse JSON
        const data = await response.json();
        const publications = data.entries || [];
        
        // Filter for preprints (entries without journal_ref but with arxiv_url)
        allPreprints = publications.filter(pub => !pub.journal_ref && pub.arxiv_url);
        
        // Filter for published papers (entries with journal_ref)
        allPublications = publications.filter(pub => pub.journal_ref);
        
        // Sort preprints by date (most recent first)
        allPreprints.sort((a, b) => {
            const dateA = new Date(a.published || 0);
            const dateB = new Date(b.published || 0);
            return dateB - dateA;
        });
        
        // Sort publications by year (most recent first), using journal year or fallback to published year
        allPublications.sort((a, b) => {
            const yearA = extractPublicationYear(a);
            const yearB = extractPublicationYear(b);
            // Sort by year descending (most recent first)
            if (yearA !== yearB) {
                return parseInt(yearB) - parseInt(yearA);
            }
            // If same year, sort by published date
            const dateA = new Date(a.published || 0);
            const dateB = new Date(b.published || 0);
            return dateB - dateA;
        });
        
        // Display all preprints and publications initially
        displayPreprints(allPreprints);
        displayPublications(allPublications);
        
        // Add search event listener for preprints
        const preprintsSearchInput = document.getElementById('preprints-search');
        if (preprintsSearchInput) {
            preprintsSearchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                let filteredPreprints;
                
                if (searchTerm === '') {
                    // Show all preprints if search is empty
                    filteredPreprints = allPreprints;
                } else {
                    // Filter preprints by search term across all fields
                    filteredPreprints = allPreprints.filter(pub => {
                        const searchableText = JSON.stringify(pub).toLowerCase();
                        return searchableText.includes(searchTerm);
                    });
                }
                
                displayPreprints(filteredPreprints);
            });
        }
        
        // Add search event listener for publications
        const publicationsSearchInput = document.getElementById('publications-search');
        if (publicationsSearchInput) {
            publicationsSearchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                let filteredPublications;
                
                if (searchTerm === '') {
                    // Show all publications if search is empty
                    filteredPublications = allPublications;
                } else {
                    // Filter publications by search term across all fields
                    filteredPublications = allPublications.filter(pub => {
                        const searchableText = JSON.stringify(pub).toLowerCase();
                        return searchableText.includes(searchTerm);
                    });
                }
                
                displayPublications(filteredPublications);
            });
        }
        
    } catch (error) {
        console.error('Error loading preprints:', error);
        const container = document.getElementById('preprints-container');
        container.innerHTML = '<p>Error loading preprints database. Please try again later.</p>';
    }
}

// Function to display preprints
function displayPreprints(preprints) {
    // Generate HTML for preprints
    const container = document.getElementById('preprints-container');
    
    if (preprints.length === 0) {
        container.innerHTML = '<p>No preprints match your search.</p>';
        return;
    }
    
    // Build HTML for each preprint
    const preprintsHtml = preprints.map((pub, index) => {
        // Parse authors string and identify QUDYMA authors
        const authorsList = pub.authors;
        
        // Format authors with QUDYMA authors underlined and linked
        const authorsFormatted = authorsList.split(', ').map(author => {
            const authorLower = author.toLowerCase().trim();
            const isQudymaAuthor = qudymaAuthorsMap[authorLower];
            
            if (isQudymaAuthor) {
                const url = qudymaAuthorsUrls[authorLower];
                if (url) {
                    // QUDYMA author with URL
                    return `<u><a href="${url}" style="color: inherit; text-decoration: none !important; border-bottom: none !important;">${author}</a></u>`;
                } else {
                    // QUDYMA author without URL, just underline - no link
                    return `<u>${author}</u>`;
                }
            } else {
                // Non-QUDYMA author - link to arXiv search
                const arxivUrl = `https://arxiv.org/search/?query=${encodeURIComponent(author)}&searchtype=all&abstracts=show&order=-announced_date_first&size=50`;
                return `<a href="${arxivUrl}" style="color: inherit; text-decoration: none !important; border-bottom: none !important;">${author}</a>`;
            }
        }).join(', ');
        
        // Extract arXiv ID from the id field and create the link
        let arxivLink = '';
        let arxivUrl = '';
        if (pub.id) {
            // id format: "http://arxiv.org/abs/2510.22064v1"
            const arxivMatch = pub.id.match(/arxiv\.org\/abs\/(\d+\.\d+)/);
            if (arxivMatch) {
                const arxivCode = arxivMatch[1];
                arxivUrl = pub.arxiv_url || pub.id;
                // Extract year from published date
                let arxivYear = '';
                if (pub.published) {
                    const date = new Date(pub.published);
                    arxivYear = date.getFullYear().toString();
                }
                arxivLink = `<a href="${arxivUrl}">arXiv:${arxivCode} (${arxivYear})</a>`;
            }
        }
        
        // Extract month and year from published date
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
        if (index === 0 || monthYearKey !== getMonthYearKey(preprints[index - 1])) {
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
    
    // Force scrollbar to stay visible by ensuring overflow is always active
    const preprintsWrapper = document.getElementById('preprints-scroll-wrapper');
    if (preprintsWrapper) {
        preprintsWrapper.style.overflowY = 'scroll';
    }
}

// Helper function to get month-year key
function getMonthYearKey(pub) {
    if (!pub || !pub.published) return '';
    const date = new Date(pub.published);
    return `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
}

// Function to display published papers
function displayPublications(publications) {
    // Generate HTML for publications
    const container = document.getElementById('publications-container');
    
    if (publications.length === 0) {
        container.innerHTML = '<p>No publications match your search.</p>';
        return;
    }
    
    // Build HTML for each publication
    const publicationsHtml = publications.map((pub, index) => {
        // Parse authors string and identify QUDYMA authors
        const authorsList = pub.authors;
        
        // Format authors with QUDYMA authors underlined and linked
        const authorsFormatted = authorsList.split(', ').map(author => {
            const authorLower = author.toLowerCase().trim();
            const isQudymaAuthor = qudymaAuthorsMap[authorLower];
            
            if (isQudymaAuthor) {
                const url = qudymaAuthorsUrls[authorLower];
                if (url) {
                    // QUDYMA author with URL
                    return `<u><a href="${url}" style="color: inherit; text-decoration: none !important; border-bottom: none !important;">${author}</a></u>`;
                } else {
                    // QUDYMA author without URL, just underline - no link
                    return `<u>${author}</u>`;
                }
            } else {
                // Non-QUDYMA author - link to arXiv search
                const arxivUrl = `https://arxiv.org/search/?query=${encodeURIComponent(author)}&searchtype=all&abstracts=show&order=-announced_date_first&size=50`;
                return `<a href="${arxivUrl}" style="color: inherit; text-decoration: none !important; border-bottom: none !important;">${author}</a>`;
            }
        }).join(', ');
        
        // Create link to journal
        let journalLink = '';
        let doiUrl = '';
        if (pub.journal_url) {
            doiUrl = pub.journal_url;
            // Check if journal_ref ends with a year in parentheses
            let displayJournalRef = pub.journal_ref;
            if (!pub.journal_ref.match(/\(\d{4}\)\s*$/)) {
                // Add year from published date if not present
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
            // Check if journal_ref ends with a year in parentheses
            let displayJournalRef = pub.journal_ref;
            if (!pub.journal_ref.match(/\(\d{4}\)\s*$/)) {
                // Add year from published date if not present
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
        
        // Extract arXiv ID from the id field
        let arxivLink = '';
        if (pub.id) {
            // id format: "http://arxiv.org/abs/2510.22064v1"
            const arxivMatch = pub.id.match(/arxiv\.org\/abs\/(\d+\.\d+)/);
            if (arxivMatch) {
                const arxivCode = arxivMatch[1];
                const arxivUrl = pub.arxiv_url || pub.id;
                // Extract year from published date
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
        
        // Extract year from journal_ref for grouping (journal publication year, not arXiv date)
        let yearKey = extractPublicationYear(pub);
        
        // Check if this is a new year group
        let yearHeader = '';
        if (index === 0 || yearKey !== extractPublicationYear(publications[index - 1])) {
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
                ${referencesLine}
            </p>
        `;
    }).join('');
    
    container.innerHTML = publicationsHtml;
    
    // Force scrollbar to stay visible by ensuring overflow is always active
    const publicationsWrapper = document.getElementById('publications-scroll-wrapper');
    if (publicationsWrapper) {
        publicationsWrapper.style.overflowY = 'scroll';
    }
}

// Helper function to get publication year from journal_ref
function getPublicationYear(pub) {
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

// Helper function to extract publication year for sorting
// Uses journal year if available, otherwise falls back to published year
function extractPublicationYear(pub) {
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


// Load preprints when the page is ready
document.addEventListener('DOMContentLoaded', loadPreprints);
