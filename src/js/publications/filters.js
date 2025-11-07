/**
 * Filters module for publications page
 * Handles filtering, search, author buttons, and year range controls
 */

import * as state from './state.js';
import { normalizeText, extractPublicationYear, formatAuthorAsInitials, updateResultsCounter } from './utils.js';
import { displayPreprints, displayPublications } from './display.js';

/**
 * Filter preprints based on search term, author filters, and year range
 */
export function filterPreprints() {
    const searchInput = document.getElementById('publications-search');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    let filtered = state.getAllPreprints();
    
    // Apply search terms
    if (searchTerm !== '') {
        const searchTerms = searchTerm.split(/[,\s]+/)
            .filter(term => term.trim() !== '')
            .map(term => normalizeText(term));
        
        filtered = filtered.filter(pub => {
            const searchableText = normalizeText(JSON.stringify(pub).toLowerCase());
            return searchTerms.every(term => searchableText.includes(term));
        });
    }
    
    // Apply author filters
    const selectedFilters = state.getSelectedFilters();
    if (selectedFilters.size > 0) {
        filtered = filtered.filter(pub => {
            const authorsList = (pub.authors || '').toLowerCase();
            const normalizedAuthors = normalizeText(authorsList);
            const pubAuthorIds = Array.isArray(pub.author_ids) ? pub.author_ids : [];
            const canonicalNameToId = state.getCanonicalNameToId();
            
            // Check if ALL selected authors are in this publication (AND logic)
            return Array.from(selectedFilters).every(selectedAuthor => {
                const normalizedAuthor = normalizeText(selectedAuthor.toLowerCase());
                // Match by name (legacy) OR by author_ids if available
                if (normalizedAuthors.includes(normalizedAuthor)) return true;
                const authorId = canonicalNameToId[selectedAuthor];
                if (authorId && pubAuthorIds.includes(authorId)) return true;
                return false;
            });
        });
    }
    
    // Apply year range filter
    const yearRange = state.getYearRange();
    filtered = filtered.filter(pub => {
        const year = extractPublicationYear(pub);
        if (!year) return true; // Include if no year available
        const yearNum = parseInt(year);
        return yearNum >= yearRange.min && yearNum <= yearRange.max;
    });
    
    state.setFilteredPreprints(filtered);
    updateResultsCounter(filtered.length);
    displayPreprints(); // Re-render the display with filtered data
    
    return filtered;
}

/**
 * Filter publications based on search term, author filters, and year range
 */
export function filterPublications() {
    const searchInput = document.getElementById('publications-search');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    let filtered = state.getAllPublications();
    
    // Apply search terms
    if (searchTerm !== '') {
        const searchTerms = searchTerm.split(/[,\s]+/)
            .filter(term => term.trim() !== '')
            .map(term => normalizeText(term));
        
        filtered = filtered.filter(pub => {
            const searchableText = normalizeText(JSON.stringify(pub).toLowerCase());
            return searchTerms.every(term => searchableText.includes(term));
        });
    }
    
    // Apply author filters
    const selectedFilters = state.getSelectedFilters();
    if (selectedFilters.size > 0) {
        filtered = filtered.filter(pub => {
            const authorsList = (pub.authors || '').toLowerCase();
            const normalizedAuthors = normalizeText(authorsList);
            const pubAuthorIds = Array.isArray(pub.author_ids) ? pub.author_ids : [];
            const canonicalNameToId = state.getCanonicalNameToId();
            
            // Check if ALL selected authors are in this publication (AND logic)
            return Array.from(selectedFilters).every(selectedAuthor => {
                const normalizedAuthor = normalizeText(selectedAuthor.toLowerCase());
                // Match by name (legacy) OR by author_ids if available
                if (normalizedAuthors.includes(normalizedAuthor)) return true;
                const authorId = canonicalNameToId[selectedAuthor];
                if (authorId && pubAuthorIds.includes(authorId)) return true;
                return false;
            });
        });
    }
    
    // Apply year range filter
    const yearRange = state.getYearRange();
    filtered = filtered.filter(pub => {
        const year = extractPublicationYear(pub);
        if (!year) return true; // Include if no year available
        const yearNum = parseInt(year);
        return yearNum >= yearRange.min && yearNum <= yearRange.max;
    });
    
    state.setFilteredPublications(filtered);
    updateResultsCounter(filtered.length);
    displayPublications(); // Re-render the display with filtered data
    
    return filtered;
}

/**
 * Update filters display for current view
 * Recreates filter buttons and year slider
 */
export function updateFiltersForView() {
    const filterContainer = document.getElementById('publications-filters');
    const yearSliderContainer = document.getElementById('publications-year-slider');
    
    if (!filterContainer || !yearSliderContainer) return;
    
    // Clear existing filters
    filterContainer.innerHTML = '';
    yearSliderContainer.innerHTML = '';
    
    const selectedFilters = state.getSelectedFilters();
    const activeMembers = state.getActiveMembers();
    const currentView = state.getCurrentView();
    
    // Recreate filter buttons
    activeMembers.forEach(memberName => {
        const button = document.createElement('span');
        button.className = 'author-filter';
        button.textContent = formatAuthorAsInitials(memberName);
        button.dataset.author = memberName;
        
        // Set active state if in filter set
        if (selectedFilters.has(memberName)) {
            button.classList.add('active');
        }
        
        button.addEventListener('click', function() {
            // Toggle filter
            if (this.classList.contains('active')) {
                this.classList.remove('active');
                state.removeFilter(memberName);
            } else {
                this.classList.add('active');
                state.addFilter(memberName);
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
    createYearSlider(yearSliderContainer);
}

/**
 * Create year range slider with inputs
 * @param {HTMLElement} container - Container element for the slider
 */
function createYearSlider(container) {
    const currentYear = new Date().getFullYear();
    const minYear = state.getDynamicMinYear();
    const yearRange = state.getYearRange();
    const currentView = state.getCurrentView();
    
    container.innerHTML = `
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
        
        state.setMinYear(minValue);
        
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
        
        state.setMaxYear(maxValue);
        
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

/**
 * Switch between preprints and publications view
 * @param {string} view - 'preprints' or 'publications'
 */
export function switchView(view) {
    state.setCurrentView(view);
    
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
