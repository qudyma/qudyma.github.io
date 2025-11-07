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
        
        // Initialize with preprints view
        state.setCurrentView('preprints');
        
        // Display initial view (preprints)
        const filteredPreprints = filterPreprints();
        displayPreprints(filteredPreprints);
        
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
