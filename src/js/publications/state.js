/**
 * State management for publications page
 * Centralized storage for all global variables
 */

const state = {
    // Data arrays
    allPreprints: [],
    allPublications: [],
    filteredPreprints: [],
    filteredPublications: [],
    
    // Author mappings
    qudymaAuthorsMap: {},
    qudymaAuthorsUrls: {},
    qudymaAuthorsById: {},
    activeMembers: [],
    canonicalNameToId: {}, // map canonical author name -> author id from basics.json
    
    // Filter and view state
    selectedFilters: new Set(), // Single filter set shared across both views
    yearRange: { min: 2020, max: new Date().getFullYear() }, // Single year range shared across both views
    dynamicMinYear: 2020, // Will be calculated from data (allows going earlier if user changes it)
    absoluteMinYear: 2020, // Absolute minimum available in database (for validation)
    currentView: 'preprints' // Track current view: 'preprints' or 'publications'
};

// Getters
export const getState = () => state;

export const getAllPreprints = () => state.allPreprints;
export const setAllPreprints = (preprints) => { state.allPreprints = preprints; };

export const getAllPublications = () => state.allPublications;
export const setAllPublications = (publications) => { state.allPublications = publications; };

export const getFilteredPreprints = () => state.filteredPreprints;
export const setFilteredPreprints = (preprints) => { state.filteredPreprints = preprints; };

export const getFilteredPublications = () => state.filteredPublications;
export const setFilteredPublications = (publications) => { state.filteredPublications = publications; };

export const getQudymaAuthorsMap = () => state.qudymaAuthorsMap;
export const setQudymaAuthorsMap = (map) => { state.qudymaAuthorsMap = map; };

export const getQudymaAuthorsUrls = () => state.qudymaAuthorsUrls;
export const setQudymaAuthorsUrls = (urls) => { state.qudymaAuthorsUrls = urls; };

export const getQudymaAuthorsById = () => state.qudymaAuthorsById;
export const setQudymaAuthorsById = (authors) => { state.qudymaAuthorsById = authors; };

export const getActiveMembers = () => state.activeMembers;
export const setActiveMembers = (members) => { state.activeMembers = members; };

export const getCanonicalNameToId = () => state.canonicalNameToId;
export const setCanonicalNameToId = (map) => { state.canonicalNameToId = map; };

export const getSelectedFilters = () => state.selectedFilters;
export const addFilter = (filter) => { state.selectedFilters.add(filter); };
export const removeFilter = (filter) => { state.selectedFilters.delete(filter); };
export const clearFilters = () => { state.selectedFilters.clear(); };

export const getYearRange = () => state.yearRange;
export const setYearRange = (range) => { state.yearRange = range; };
export const setMinYear = (min) => { state.yearRange.min = min; };
export const setMaxYear = (max) => { state.yearRange.max = max; };

export const getDynamicMinYear = () => state.dynamicMinYear;
export const setDynamicMinYear = (year) => { state.dynamicMinYear = year; };

export const getAbsoluteMinYear = () => state.absoluteMinYear;
export const setAbsoluteMinYear = (year) => { state.absoluteMinYear = year; };

export const getCurrentView = () => state.currentView;
export const setCurrentView = (view) => { state.currentView = view; };
