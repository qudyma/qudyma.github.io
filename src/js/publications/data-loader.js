/**
 * Data loading module for publications page
 * Handles fetching and caching of publications and author data
 */

import * as state from './state.js';
import { extractPublicationYear } from './utils.js';

/**
 * Load authors configuration from members.json
 * @returns {Promise<Object>} Configuration data
 */
export async function loadAuthorsConfig() {
    // Cache-busting: timestamp updates every 6 hours for members.json (changes less frequently)
    const basicsTimestamp = Math.floor(Date.now() / (1000 * 60 * 60 * 6));
    
    const configUrl = `https://raw.githubusercontent.com/qudyma/qudyma_db/main/config/members.json?v=${basicsTimestamp}`;
    const configResponse = await fetch(configUrl);
    
    if (!configResponse.ok) {
        throw new Error(`Failed to fetch QUDYMA members config: ${configResponse.status}`);
    }
    
    const configData = await configResponse.json();
    
    // Extract QUDYMA author names and their variants, and identify active members
    const qudymaAuthorsMap = {};
    const qudymaAuthorsUrls = {};
    const canonicalNameToId = {};
    const activeMembers = [];
    
    // members.json is keyed by author id; iterate entries to capture ids
    Object.entries(configData).forEach(([authorId, member]) => {
        if (member && member.name) {
            const canonical = member.name;
            // Map lowercase name/variants to canonical name
            qudymaAuthorsMap[canonical.toLowerCase()] = canonical; // Store canonical name
            canonicalNameToId[canonical] = authorId; // map canonical name -> id
            
            // Get URL: prefer social.web, fallback to social.google_scholar
            if (member.social) {
                const url = member.social.web || member.social.google_scholar;
                if (url) {
                    qudymaAuthorsUrls[canonical.toLowerCase()] = url;
                }
            }

            // Check if member is active (status is 'member', not 'visitor')
            if (member.date_in && !member.date_out && member.status === 'member') {
                activeMembers.push(canonical);
            }

            // Also add name variants, but map them to the canonical name and id
            if (member.name_variants) {
                member.name_variants.forEach(variant => {
                    qudymaAuthorsMap[variant.toLowerCase()] = canonical; // Map variant to canonical name
                    if (member.social) {
                        const url = member.social.web || member.social.google_scholar;
                        if (url) {
                            qudymaAuthorsUrls[variant.toLowerCase()] = url;
                        }
                    }
                });
            }
        }
    });
    
    // Update state
    state.setQudymaAuthorsMap(qudymaAuthorsMap);
    state.setQudymaAuthorsUrls(qudymaAuthorsUrls);
    state.setCanonicalNameToId(canonicalNameToId);
    state.setActiveMembers(activeMembers);
    
    return configData;
}

/**
 * Load publications from database
 * @returns {Promise<Array>} Array of publications
 */
export async function loadPublications() {
    // Cache-busting: timestamp updates every 1 hour for publications.json (updates more frequently)
    const publicationsTimestamp = Math.floor(Date.now() / (1000 * 60 * 60));
    
    const dbUrl = `https://raw.githubusercontent.com/qudyma/qudyma_db/main/data/publications.json?v=${publicationsTimestamp}`;
    const response = await fetch(dbUrl);
    
    if (!response.ok) {
        throw new Error(`Failed to fetch publications database: ${response.status}`);
    }
    
    // Parse JSON
    const data = await response.json();
    const publications = data.entries || [];
    
    console.log('Total entries:', publications.length);
    console.log('Entries with arxiv_url:', publications.filter(p => p.arxiv_url).length);
    console.log('Entries with journal_ref:', publications.filter(p => p.journal_ref).length);
    console.log('Entries with arxiv_url AND NO journal_ref:', publications.filter(p => p.arxiv_url && !p.journal_ref).length);
    console.log('Entries with arxiv_url AND journal_ref:', publications.filter(p => p.arxiv_url && p.journal_ref).length);
    
    // Calculate and store minimum year
    calculateMinYear(publications);
    
    return publications;
}

/**
 * Calculate minimum year from publications and update state
 * @param {Array} publications - Array of publication objects
 */
export function calculateMinYear(publications) {
    const years = publications
        .map(pub => {
            if (pub.published) {
                return parseInt(pub.published.substring(0, 4));
            }
            return null;
        })
        .filter(year => year !== null);
    
    if (years.length > 0) {
        const minYear = Math.min(...years);
        console.log('Absolute min year from database:', minYear);
        state.setAbsoluteMinYear(minYear);
        state.setDynamicMinYear(minYear);
    }
}

/**
 * Process publications into preprints and published papers
 * @param {Array} publications - Raw publications array
 * @returns {Object} Object with preprints and published arrays
 */
export function processPublications(publications) {
    // Filter for preprints (entries without journal_ref but with arxiv_url)
    const preprints = publications.filter(pub => !pub.journal_ref && pub.arxiv_url);
    
    // Filter for published papers (entries with journal_ref)
    const published = publications.filter(pub => pub.journal_ref);
    
    // Sort preprints by date (most recent first)
    preprints.sort((a, b) => {
        const dateA = new Date(a.published || 0);
        const dateB = new Date(b.published || 0);
        return dateB - dateA;
    });
    
    // Sort publications by year (most recent first), using journal year or fallback to published year
    published.sort((a, b) => {
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
    
    return { preprints, published };
}

/**
 * Main data loading function - loads everything and updates state
 * @returns {Promise<void>}
 */
export async function loadAllData() {
    try {
        // Load authors configuration
        await loadAuthorsConfig();
        
        // Load publications
        const publications = await loadPublications();
        
        // Process and sort publications
        const { preprints, published } = processPublications(publications);
        
        // Update state
        state.setAllPreprints(preprints);
        state.setAllPublications(published);
        state.setFilteredPreprints(preprints);
        state.setFilteredPublications(published);
        
        console.log('Data loaded successfully');
        console.log('Preprints:', preprints.length);
        console.log('Published:', published.length);
        
    } catch (error) {
        console.error('Error loading data:', error);
        throw error;
    }
}
