// Global variables to store data
let allPreprints = [];
let allPublications = [];
let filteredPreprints = [];
let filteredPublications = [];
let qudymaAuthorsMap = {};
let qudymaAuthorsUrls = {};
let activeMembers = [];
let selectedPreprintFilters = new Set();
let selectedPublicationFilters = new Set();
let preprintsYearRange = { min: 2020, max: new Date().getFullYear() };
let publicationsYearRange = { min: 2020, max: new Date().getFullYear() };

// Helper function to normalize text by removing accents and diacritics
function normalizeText(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Function to create filter buttons for active members
function createFilterButtons(containerId, section) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = ''; // Clear existing
    
    activeMembers.forEach(memberName => {
        const button = document.createElement('span');
        button.className = 'author-filter';
        // Display as initials + surname
        button.textContent = formatAuthorAsInitials(memberName);
        button.dataset.author = memberName;
        
        button.addEventListener('click', function() {
            const filterSet = section === 'preprints' ? selectedPreprintFilters : selectedPublicationFilters;
            
            if (this.classList.contains('active')) {
                this.classList.remove('active');
                filterSet.delete(memberName);
            } else {
                this.classList.add('active');
                filterSet.add(memberName);
            }
            
            // Trigger search update
            if (section === 'preprints') {
                filterPreprints();
            } else {
                filterPublications();
            }
        });
        
        container.appendChild(button);
    });
}

// Function to create year range slider
function createYearSlider(containerId, section) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const currentYear = new Date().getFullYear();
    const minYear = 2020;
    const yearRange = section === 'preprints' ? preprintsYearRange : publicationsYearRange;
    
    container.innerHTML = `
        <div class="year-slider-container">
            <div class="year-range-inputs">
                <span class="year-slider-label">Year:</span>
                <input type="number" id="${section}-year-min" class="year-input" min="${minYear}" max="${currentYear}" value="${yearRange.min}">
                <span class="year-separator">–</span>
                <input type="number" id="${section}-year-max" class="year-input" min="${minYear}" max="${currentYear}" value="${yearRange.max}">
            </div>
        </div>
    `;
    
    // Add event listeners for inputs
    const minInput = document.getElementById(`${section}-year-min`);
    const maxInput = document.getElementById(`${section}-year-max`);
    
    // Validate and update on change (when user finishes typing or uses arrows)
    minInput.addEventListener('change', function() {
        let minValue = parseInt(this.value);
        let maxValue = parseInt(maxInput.value);
        
        // Validate input
        if (isNaN(minValue) || minValue < minYear) {
            minValue = minYear;
            this.value = minValue;
        }
        if (minValue > currentYear) {
            minValue = currentYear;
            this.value = minValue;
        }
        
        // Ensure min doesn't exceed max
        if (minValue > maxValue) {
            minValue = maxValue;
            this.value = minValue;
        }
        
        yearRange.min = minValue;
        
        // Trigger filter update
        if (section === 'preprints') {
            filterPreprints();
        } else {
            filterPublications();
        }
    });
    
    // Also validate on blur (when clicking away)
    minInput.addEventListener('blur', function() {
        // Trigger change event to validate
        this.dispatchEvent(new Event('change'));
    });
    
    // Also validate on Enter key
    minInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            this.blur();
        }
    });
    
    maxInput.addEventListener('change', function() {
        let maxValue = parseInt(this.value);
        let minValue = parseInt(minInput.value);
        
        // Validate input
        if (isNaN(maxValue) || maxValue < minYear) {
            maxValue = minYear;
            this.value = maxValue;
        }
        if (maxValue > currentYear) {
            maxValue = currentYear;
            this.value = maxValue;
        }
        
        // Ensure max doesn't go below min
        if (maxValue < minValue) {
            maxValue = minValue;
            this.value = maxValue;
        }
        
        yearRange.max = maxValue;
        
        // Trigger filter update
        if (section === 'preprints') {
            filterPreprints();
        } else {
            filterPublications();
        }
    });
    
    // Also validate on blur (when clicking away)
    maxInput.addEventListener('blur', function() {
        // Trigger change event to validate
        this.dispatchEvent(new Event('change'));
    });
    
    // Also validate on Enter key
    maxInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            this.blur();
        }
    });
}

// Function to filter preprints based on search and active filters
function filterPreprints() {
    const searchInput = document.getElementById('preprints-search');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    filteredPreprints = allPreprints;
    
    // Apply search terms
    if (searchTerm !== '') {
        const searchTerms = searchTerm.split(/[,\s]+/)
            .filter(term => term.trim() !== '')
            .map(term => normalizeText(term));
        
        filteredPreprints = filteredPreprints.filter(pub => {
            const searchableText = normalizeText(JSON.stringify(pub).toLowerCase());
            return searchTerms.every(term => searchableText.includes(term));
        });
    }
    
    // Apply author filters
    if (selectedPreprintFilters.size > 0) {
        filteredPreprints = filteredPreprints.filter(pub => {
            const authorsList = pub.authors.toLowerCase();
            const normalizedAuthors = normalizeText(authorsList);
            // Check if ALL selected authors are in this publication (AND logic)
            return Array.from(selectedPreprintFilters).every(selectedAuthor => {
                const normalizedAuthor = normalizeText(selectedAuthor.toLowerCase());
                return normalizedAuthors.includes(normalizedAuthor);
            });
        });
    }
    
    // Apply year range filter
    filteredPreprints = filteredPreprints.filter(pub => {
        const year = extractPublicationYear(pub);
        if (!year) return true; // Include if no year available
        const yearNum = parseInt(year);
        return yearNum >= preprintsYearRange.min && yearNum <= preprintsYearRange.max;
    });
    
    displayPreprints(filteredPreprints);
}

// Function to filter publications based on search and active filters
function filterPublications() {
    const searchInput = document.getElementById('publications-search');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    filteredPublications = allPublications;
    
    // Apply search terms
    if (searchTerm !== '') {
        const searchTerms = searchTerm.split(/[,\s]+/)
            .filter(term => term.trim() !== '')
            .map(term => normalizeText(term));
        
        filteredPublications = filteredPublications.filter(pub => {
            const searchableText = normalizeText(JSON.stringify(pub).toLowerCase());
            return searchTerms.every(term => searchableText.includes(term));
        });
    }
    
    // Apply author filters
    if (selectedPublicationFilters.size > 0) {
        filteredPublications = filteredPublications.filter(pub => {
            const authorsList = pub.authors.toLowerCase();
            const normalizedAuthors = normalizeText(authorsList);
            // Check if ALL selected authors are in this publication (AND logic)
            return Array.from(selectedPublicationFilters).every(selectedAuthor => {
                const normalizedAuthor = normalizeText(selectedAuthor.toLowerCase());
                return normalizedAuthors.includes(normalizedAuthor);
            });
        });
    }
    
    // Apply year range filter
    filteredPublications = filteredPublications.filter(pub => {
        const year = extractPublicationYear(pub);
        if (!year) return true; // Include if no year available
        const yearNum = parseInt(year);
        return yearNum >= publicationsYearRange.min && yearNum <= publicationsYearRange.max;
    });
    
    displayPublications(filteredPublications);
}

// Helper function to format author name as "Initials. Surname"
function formatAuthorAsInitials(fullName) {
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
        
        // Extract QUDYMA author names and their variants, and identify active members
        Object.values(configData).forEach(member => {
            if (member.name) {
                qudymaAuthorsMap[member.name.toLowerCase()] = member.name; // Store canonical name
                if (member.url) {
                    qudymaAuthorsUrls[member.name.toLowerCase()] = member.url;
                }
                
                // Check if member is active (has date_in and date_out is null)
                if (member.date_in && !member.date_out) {
                    activeMembers.push(member.name);
                }
                
                // Also add name variants, but map them to the canonical name
                if (member.name_variants) {
                    member.name_variants.forEach(variant => {
                        qudymaAuthorsMap[variant.toLowerCase()] = member.name; // Map variant to canonical name
                        if (member.url) {
                            qudymaAuthorsUrls[variant.toLowerCase()] = member.url;
                        }
                    });
                }
            }
        });
        
        // Keep the order from basics.json (don't sort)
        
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
        
        // Display all preprints and publications initially using filter functions
        filterPreprints();
        filterPublications();
        
        // Create filter buttons for active members
        createFilterButtons('preprints-filters', 'preprints');
        createFilterButtons('publications-filters', 'publications');
        
        // Create year range sliders
        createYearSlider('preprints-year-slider', 'preprints');
        createYearSlider('publications-year-slider', 'publications');
        
        // Add search event listener for preprints
        const preprintsSearchInput = document.getElementById('preprints-search');
        if (preprintsSearchInput) {
            preprintsSearchInput.addEventListener('input', filterPreprints);
        }
        
        // Add search event listener for publications
        const publicationsSearchInput = document.getElementById('publications-search');
        if (publicationsSearchInput) {
            publicationsSearchInput.addEventListener('input', filterPublications);
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
        
        // Build awards line if awards exist
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
        
        // Build coverage line if coverage exists
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
                ${referencesLine}${awardsLine}${coverageLine}
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

// Function to download JSON data
function downloadJSON(data, filename) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Setup download button event listeners
function setupDownloadButtons() {
    const downloadPreprints = document.getElementById('download-preprints-json');
    const downloadPublications = document.getElementById('download-publications-json');
    
    if (downloadPreprints) {
        downloadPreprints.addEventListener('click', function() {
            const timestamp = new Date().toISOString().split('T')[0];
            downloadJSON(filteredPreprints, `qudyma_preprints_${timestamp}.json`);
        });
    }
    
    if (downloadPublications) {
        downloadPublications.addEventListener('click', function() {
            const timestamp = new Date().toISOString().split('T')[0];
            downloadJSON(filteredPublications, `qudyma_publications_${timestamp}.json`);
        });
    }
}

// Load preprints when the page is ready
document.addEventListener('DOMContentLoaded', function() {
    loadPreprints();
    setupDownloadButtons();
});
