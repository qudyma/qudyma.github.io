/**
 * Main entry point for publications page
 * Initializes the page, loads data, and sets up event listeners
 */

import { loadAllData } from './data-loader.js';
import { filterPreprints, filterPublications, updateFiltersForView, switchView } from './filters.js';
import { displayPreprints, displayPublications } from './display.js';
import { setupDownloadButtons } from './export.js';
import * as state from './state.js';

/**
 * Initialize the publications page
 */
async function init() {
    try {
        // Load all data
        await loadAllData();

        // Check URL params for view, authorId, and authorName
        const params = new URLSearchParams(window.location.search);
        const viewParam = params.get('view');
        const authorIdParam = params.get('authorId');
        const authorNameParam = params.get('authorName');

        let initialView = 'preprints';
        if (viewParam === 'published') {
            initialView = 'publications';
        }

        // If authorId is present, find canonical name and set as filter
        // If authorName is present, set search bar to that name
        let authorFilterSet = false;
        if (authorIdParam) {
            const canonicalNameToId = state.getCanonicalNameToId();
            let authorName = null;
            for (const [name, id] of Object.entries(canonicalNameToId)) {
                if (id === authorIdParam) {
                    authorName = name;
                    break;
                }
            }
            if (authorName) {
                state.clearFilters();
                state.addFilter(authorName);
                authorFilterSet = true;
            }
        } else if (authorNameParam) {
            state.clearFilters();
            // Set the search bar to the author name
            setTimeout(() => {
                const searchInput = document.getElementById('publications-search');
                if (searchInput) {
                    searchInput.value = authorNameParam;
                    // Trigger input event to update results
                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }, 0);
        } else {
            state.clearFilters();
        }

        // Always use switchView to ensure toggle UI updates
        switchView(initialView);

        // Display correct view after switchView (which also updates filters)
        if (initialView === 'preprints') {
            const filteredPreprints = filterPreprints();
            displayPreprints(filteredPreprints);
        } else {
            const filteredPublications = filterPublications();
            displayPublications(filteredPublications);
        }

        // Set up unified filters for the initial view
        updateFiltersForView();

        // Add search event listener for unified search input
        const searchInput = document.getElementById('publications-search');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                const currentView = state.getCurrentView();
                if (currentView === 'preprints') {
                    const filtered = filterPreprints();
                    displayPreprints(filtered);
                } else {
                    const filtered = filterPublications();
                    displayPublications(filtered);
                }
            });
        }

        // Set up toggle button listeners
        document.querySelectorAll('.toggle-button').forEach(button => {
            button.addEventListener('click', function() {
                const view = this.dataset.view;
                switchView(view);

                // Display the appropriate view after switch
                if (view === 'preprints') {
                    const filtered = filterPreprints();
                    displayPreprints(filtered);
                } else {
                    const filtered = filterPublications();
                    displayPublications(filtered);
                }
            });
        });

        // Set up download buttons
        setupDownloadButtons();

        console.log('Publications page initialized successfully');

    } catch (error) {
        console.error('Error initializing publications page:', error);
        const container = document.getElementById('publications-container');
        if (container) {
            container.innerHTML = '<p>Error loading publications database. Please try again later.</p>';
        }
    }
}

// Load when the page is ready
document.addEventListener('DOMContentLoaded', init);

// Export for potential external use
export { init };
