// Global variables to store data
let allPreprints = [];
let allPublications = [];
let filteredPreprints = [];
let filteredPublications = [];
let qudymaAuthorsMap = {};
let qudymaAuthorsUrls = {};
let activeMembers = [];
let selectedFilters = new Set(); // Single filter set shared across both views
let yearRange = { min: 2020, max: new Date().getFullYear() }; // Single year range shared across both views
let currentView = 'preprints'; // Track current view: 'preprints' or 'publications'

// Helper function to normalize text by removing accents and diacritics
function normalizeText(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Function to update the results counter
function updateResultsCounter(count) {
    const counter = document.querySelector('.search-results-counter');
    if (counter) {
        counter.textContent = count + ' result' + (count !== 1 ? 's' : '');
    }
}

// Function to switch between preprints and publications view
function switchView(view) {
    currentView = view;
    
    // Update toggle buttons and slider
    const slider = document.querySelector('.toggle-slider');
    document.querySelectorAll('.toggle-button').forEach(btn => {
        if (btn.dataset.view === view) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Animate slider position
    if (slider) {
        if (view === 'preprints') {
            slider.classList.remove('publications');
        } else {
            slider.classList.add('publications');
        }
    }
    
    // Update filters to match current view
    updateFiltersForView();
    
    // Trigger appropriate filter
    if (view === 'preprints') {
        filterPreprints();
    } else {
        filterPublications();
    }
}

// Function to update filters for current view
function updateFiltersForView() {
    const filterContainer = document.getElementById('publications-filters');
    const yearSliderContainer = document.getElementById('publications-year-slider');
    
    if (!filterContainer || !yearSliderContainer) return;
    
    // Clear existing filters
    filterContainer.innerHTML = '';
    yearSliderContainer.innerHTML = '';
    
    // Use shared filter set for all views
    const filterSet = selectedFilters;
    
    // Recreate filter buttons
    activeMembers.forEach(memberName => {
        const button = document.createElement('span');
        button.className = 'author-filter';
        button.textContent = formatAuthorAsInitials(memberName);
        button.dataset.author = memberName;
        
        // Set active state if in filter set
        if (filterSet.has(memberName)) {
            button.classList.add('active');
        }
        
        button.addEventListener('click', function() {
            // Use shared filter set
            if (this.classList.contains('active')) {
                this.classList.remove('active');
                selectedFilters.delete(memberName);
            } else {
                this.classList.add('active');
                selectedFilters.add(memberName);
            }
            
            // Trigger search update
            if (currentView === 'preprints') {
                filterPreprints();
            } else {
                filterPublications();
            }
        });
        
        filterContainer.appendChild(button);
    });
    
    // Recreate year slider
    const currentYear = new Date().getFullYear();
    const minYear = 2020;
    
    yearSliderContainer.innerHTML = `
        <div class="year-slider-container">
            <div class="year-range-inputs">
                <span class="year-slider-label">Year:</span>
                <input type="number" id="unified-year-min" class="year-input" min="${minYear}" max="${currentYear}" value="${yearRange.min}">
                <span class="year-separator">–</span>
                <input type="number" id="unified-year-max" class="year-input" min="${minYear}" max="${currentYear}" value="${yearRange.max}">
            </div>
        </div>
    `;
    
    // Add event listeners for year inputs
    const minInput = document.getElementById('unified-year-min');
    const maxInput = document.getElementById('unified-year-max');
    
    minInput.addEventListener('change', function() {
        let minValue = parseInt(this.value);
        let maxValue = parseInt(maxInput.value);
        
        if (isNaN(minValue) || minValue < minYear) {
            minValue = minYear;
            this.value = minValue;
        }
        if (minValue > currentYear) {
            minValue = currentYear;
            this.value = minValue;
        }
        if (minValue > maxValue) {
            minValue = maxValue;
            this.value = minValue;
        }
        
        yearRange.min = minValue;
        
        if (currentView === 'preprints') {
            filterPreprints();
        } else {
            filterPublications();
        }
    });
    
    minInput.addEventListener('blur', function() {
        this.dispatchEvent(new Event('change'));
    });
    
    minInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            this.blur();
        }
    });
    
    maxInput.addEventListener('change', function() {
        let minValue = parseInt(minInput.value);
        let maxValue = parseInt(this.value);
        
        if (isNaN(maxValue) || maxValue > currentYear) {
            maxValue = currentYear;
            this.value = maxValue;
        }
        if (maxValue < minYear) {
            maxValue = minYear;
            this.value = maxValue;
        }
        if (maxValue < minValue) {
            maxValue = minValue;
            this.value = maxValue;
        }
        
        yearRange.max = maxValue;
        
        if (currentView === 'preprints') {
            filterPreprints();
        } else {
            filterPublications();
        }
    });
    
    maxInput.addEventListener('blur', function() {
        this.dispatchEvent(new Event('change'));
    });
    
    maxInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            this.blur();
        }
    });
}

// Function to create filter buttons for active members (legacy - kept for compatibility)
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
    const searchInput = document.getElementById('publications-search');
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
    if (selectedFilters.size > 0) {
        filteredPreprints = filteredPreprints.filter(pub => {
            const authorsList = pub.authors.toLowerCase();
            const normalizedAuthors = normalizeText(authorsList);
            // Check if ALL selected authors are in this publication (AND logic)
            return Array.from(selectedFilters).every(selectedAuthor => {
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
        return yearNum >= yearRange.min && yearNum <= yearRange.max;
    });
    
    updateResultsCounter(filteredPreprints.length);
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
    if (selectedFilters.size > 0) {
        filteredPublications = filteredPublications.filter(pub => {
            const authorsList = pub.authors.toLowerCase();
            const normalizedAuthors = normalizeText(authorsList);
            // Check if ALL selected authors are in this publication (AND logic)
            return Array.from(selectedFilters).every(selectedAuthor => {
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
        return yearNum >= yearRange.min && yearNum <= yearRange.max;
    });
    
    updateResultsCounter(filteredPublications.length);
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
        
        // Initialize with preprints view
        currentView = 'preprints';
        
        // Display initial view (preprints)
        filterPreprints();
        
        // Set up unified filters for the initial view
        updateFiltersForView();
        
        // Add search event listener for unified search input
        const searchInput = document.getElementById('publications-search');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                if (currentView === 'preprints') {
                    filterPreprints();
                } else {
                    filterPublications();
                }
            });
        }
        
        // Set up toggle button listeners
        document.querySelectorAll('.toggle-button').forEach(button => {
            button.addEventListener('click', function() {
                const view = this.dataset.view;
                switchView(view);
            });
        });
        
    } catch (error) {
        console.error('Error loading preprints:', error);
        const container = document.getElementById('publications-container');
        if (container) {
            container.innerHTML = '<p>Error loading publications database. Please try again later.</p>';
        }
    }
}

// Function to display preprints
function displayPreprints(preprints) {
    // Generate HTML for preprints - use unified container
    const container = document.getElementById('publications-container');
    
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

// Function to convert special characters to LaTeX format
function toLatex(text) {
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

// Function to convert publication to BibTeX format
function pubToBibTeX(pub, isPreprint = false) {
    // Determine entry type
    let entryType = '@article';
    if (isPreprint) {
        entryType = '@misc';
    } else if (pub.type && pub.type.toLowerCase() === 'book') {
        entryType = '@book';
    }
    
    // Generate citation key using DOI or arXiv ID
    let citationKey = '';
    if (pub.doi) {
        // Use last part of DOI (e.g., "10.1103/PhysRevB.112.134520" -> "PhysRevB.112.134520")
        citationKey = pub.doi.replace('10.', '').replace(/\//g, '.');
    } else if (pub.arxiv_id) {
        // Use arXiv ID (e.g., "2510.00921")
        citationKey = pub.arxiv_id.replace('.', '');
    } else {
        // Fallback to FirstAuthor:Year
        const firstAuthor = pub.authors ? pub.authors.split(',')[0].trim().split(' ').pop() : 'Unknown';
        const year = extractPublicationYear(pub) || new Date().getFullYear();
        citationKey = `${firstAuthor}:${year}`;
    }
    
    let bibtex = `${entryType}{${citationKey},\n`;
    
    // Add title (convert special characters to LaTeX)
    if (pub.title) {
        bibtex += `  title = {${toLatex(pub.title)}},\n`;
    }
    
    // Add authors (convert special characters to LaTeX)
    if (pub.authors) {
        bibtex += `  author = {${toLatex(pub.authors)}},\n`;
    }
    
    // Add year
    const year = extractPublicationYear(pub);
    if (year) {
        bibtex += `  year = ${year},\n`;
    }
    
    // Add month if available
    if (pub.published) {
        const date = new Date(pub.published);
        const month = date.toLocaleString('en', { month: 'short' }).toLowerCase();
        bibtex += `  month = ${month},\n`;
    }
    
    if (isPreprint) {
        // Preprint-specific fields (@misc)
        if (pub.arxiv_id) {
            bibtex += `  number = {arXiv:${pub.arxiv_id}},\n`;
            bibtex += `  eprint = {${pub.arxiv_id}},\n`;
            bibtex += `  primaryclass = {cond-mat},\n`;
            bibtex += `  publisher = {arXiv},\n`;
            bibtex += `  archiveprefix = {arXiv},\n`;
        }
        if (pub.doi) {
            bibtex += `  doi = {${pub.doi}},\n`;
        }
        // Add URL for preprints (arxiv_url)
        if (pub.arxiv_url) {
            bibtex += `  url = {${pub.arxiv_url}},\n`;
        }
    } else {
        // Publication-specific fields (@article or @book)
        if (pub.journal_ref) {
            // Parse journal reference to extract just the journal name (before volume number)
            // Example: "Phys. Rev. B 112, 134520 (2025)" -> journal = "Phys. Rev. B"
            const journalMatch = pub.journal_ref.match(/^(.+?)\s+\d+/);
            if (journalMatch) {
                bibtex += `  journal = {${toLatex(journalMatch[1].trim())}},\n`;
            } else {
                // If no volume found, try to get everything before comma
                const journalMatch2 = pub.journal_ref.match(/^([^,]+)/);
                if (journalMatch2) {
                    bibtex += `  journal = {${toLatex(journalMatch2[1].trim())}},\n`;
                }
            }
            
            // Try to parse volume (digits after journal name)
            const volumeMatch = pub.journal_ref.match(/\s+(\d+),/);
            if (volumeMatch) {
                bibtex += `  volume = {${volumeMatch[1]}},\n`;
            }
            
            // Try to parse number/issue (if present)
            const numberMatch = pub.journal_ref.match(/,\s*(\d+)\s*\(/);
            if (numberMatch) {
                bibtex += `  number = {${numberMatch[1]}},\n`;
            }
            
            // Try to parse pages
            const pagesMatch = pub.journal_ref.match(/,\s*(\d+)/);
            if (pagesMatch) {
                bibtex += `  pages = {${pagesMatch[1]}},\n`;
            }
        }
        
        // Add publisher for articles/books (convert special characters to LaTeX)
        if (pub.publisher) {
            bibtex += `  publisher = {${toLatex(pub.publisher)}},\n`;
        }
        
        if (pub.doi) {
            bibtex += `  doi = {${pub.doi}},\n`;
        }
        
        // Add URL (journal_url)
        if (pub.journal_url) {
            bibtex += `  url = {${pub.journal_url}},\n`;
        }
        
        if (pub.type && pub.type.toLowerCase() === 'book') {
            // Book-specific fields
            if (pub.edition) {
                bibtex += `  edition = {${pub.edition}},\n`;
            }
            if (pub.isbn) {
                bibtex += `  isbn = {${pub.isbn}},\n`;
            }
        }
    }
    
    // Add summary as abstract (convert special characters to LaTeX)
    if (pub.summary) {
        const cleanAbstract = pub.summary.replace(/\n/g, ' ').replace(/\s+/g, ' ');
        bibtex += `  abstract = {${toLatex(cleanAbstract)}},\n`;
    }
    
    // Add urldate if available
    if (pub.published) {
        const date = new Date(pub.published);
        const urldate = date.toISOString().split('T')[0];
        bibtex += `  urldate = {${urldate}},\n`;
    }
    
    // Add keywords if available (convert special characters to LaTeX)
    if (pub.keywords) {
        if (Array.isArray(pub.keywords)) {
            bibtex += `  keywords = {${toLatex(pub.keywords.join(', '))}},\n`;
        } else {
            bibtex += `  keywords = {${toLatex(pub.keywords)}},\n`;
        }
    }
    
    // Add any coverage links as notes (convert special characters to LaTeX)
    if (pub.coverage && Array.isArray(pub.coverage) && pub.coverage.length > 0) {
        const coverageText = pub.coverage.map(c => `${toLatex(c.source)}: ${c.url}`).join('; ');
        bibtex += `  note = {Featured in: ${coverageText}},\n`;
    }
    
    // Add awards as additional note (convert special characters to LaTeX)
    if (pub.awards && Array.isArray(pub.awards) && pub.awards.length > 0) {
        const awardsText = pub.awards.map(a => `${toLatex(a.type)}: ${a.url}`).join('; ');
        if (pub.coverage && pub.coverage.length > 0) {
            // Append to existing note
            bibtex = bibtex.slice(0, -3) + `; Awards: ${awardsText}},\n`;
        } else {
            bibtex += `  note = {Awards: ${awardsText}},\n`;
        }
    }
    
    // Remove trailing comma and close entry
    bibtex = bibtex.slice(0, -2) + '\n}\n';
    
    return bibtex;
}

// Function to convert array of publications to BibTeX format
function dataToBibTeX(data, isPreprint = false) {
    return data.map(pub => pubToBibTeX(pub, isPreprint)).join('\n');
}

// Function to download BibTeX data
function downloadBibTeX(data, filename, isPreprint = false) {
    const bibStr = dataToBibTeX(data, isPreprint);
    const blob = new Blob([bibStr], { type: 'text/plain' });
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
    const downloadJson = document.getElementById('download-publications-json');
    const downloadBib = document.getElementById('download-publications-bib');
    
    if (downloadJson) {
        downloadJson.addEventListener('click', function() {
            const timestamp = new Date().toISOString().split('T')[0];
            const data = currentView === 'preprints' ? filteredPreprints : filteredPublications;
            const filename = currentView === 'preprints' ? 
                `qudyma_preprints_${timestamp}.json` : 
                `qudyma_publications_${timestamp}.json`;
            downloadJSON(data, filename);
        });
    }
    
    if (downloadBib) {
        downloadBib.addEventListener('click', function() {
            const timestamp = new Date().toISOString().split('T')[0];
            const data = currentView === 'preprints' ? filteredPreprints : filteredPublications;
            const filename = currentView === 'preprints' ? 
                `qudyma_preprints_${timestamp}.bib` : 
                `qudyma_publications_${timestamp}.bib`;
            const isPreprint = currentView === 'preprints';
            downloadBibTeX(data, filename, isPreprint);
        });
    }
}

// Load preprints when the page is ready
document.addEventListener('DOMContentLoaded', function() {
    loadPreprints();
    setupDownloadButtons();
});
