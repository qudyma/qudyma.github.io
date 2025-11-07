/**
 * Export module for publications page
 * Handles download functionality for JSON and BibTeX formats
 */

import * as state from './state.js';
import { toLatex, extractPublicationYear } from './utils.js';

/**
 * Convert publication to BibTeX format
 * @param {Object} pub - Publication object
 * @param {boolean} isPreprint - Whether this is a preprint
 * @returns {string} BibTeX entry
 */
export function pubToBibTeX(pub, isPreprint = false) {
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
        citationKey = pub.doi.replace('10.', '').replace(/\//g, '.');
    } else if (pub.arxiv_id) {
        citationKey = pub.arxiv_id.replace('.', '');
    } else {
        const firstAuthor = pub.authors ? pub.authors.split(',')[0].trim().split(' ').pop() : 'Unknown';
        const year = extractPublicationYear(pub) || new Date().getFullYear();
        citationKey = `${firstAuthor}:${year}`;
    }
    
    let bibtex = `${entryType}{${citationKey},\n`;
    
    // Add title
    if (pub.title) {
        bibtex += `  title = {${toLatex(pub.title)}},\n`;
    }
    
    // Add authors
    if (pub.authors) {
        bibtex += `  author = {${toLatex(pub.authors)}},\n`;
    }
    
    // Add year
    const year = extractPublicationYear(pub);
    if (year) {
        bibtex += `  year = ${year},\n`;
    }
    
    // Add month
    if (pub.published) {
        const date = new Date(pub.published);
        const month = date.toLocaleString('en', { month: 'short' }).toLowerCase();
        bibtex += `  month = ${month},\n`;
    }
    
    if (isPreprint) {
        // Preprint-specific fields
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
        if (pub.arxiv_url) {
            bibtex += `  url = {${pub.arxiv_url}},\n`;
        }
    } else {
        // Publication-specific fields
        if (pub.journal_ref) {
            const journalMatch = pub.journal_ref.match(/^(.+?)\s+\d+/);
            if (journalMatch) {
                bibtex += `  journal = {${toLatex(journalMatch[1].trim())}},\n`;
            } else {
                const journalMatch2 = pub.journal_ref.match(/^([^,]+)/);
                if (journalMatch2) {
                    bibtex += `  journal = {${toLatex(journalMatch2[1].trim())}},\n`;
                }
            }
            
            const volumeMatch = pub.journal_ref.match(/\s+(\d+),/);
            if (volumeMatch) {
                bibtex += `  volume = {${volumeMatch[1]}},\n`;
            }
            
            const numberMatch = pub.journal_ref.match(/,\s*(\d+)\s*\(/);
            if (numberMatch) {
                bibtex += `  number = {${numberMatch[1]}},\n`;
            }
            
            const pagesMatch = pub.journal_ref.match(/,\s*(\d+)/);
            if (pagesMatch) {
                bibtex += `  pages = {${pagesMatch[1]}},\n`;
            }
        }
        
        if (pub.publisher) {
            bibtex += `  publisher = {${toLatex(pub.publisher)}},\n`;
        }
        
        if (pub.doi) {
            bibtex += `  doi = {${pub.doi}},\n`;
        }
        
        if (pub.journal_url) {
            bibtex += `  url = {${pub.journal_url}},\n`;
        }
        
        if (pub.type && pub.type.toLowerCase() === 'book') {
            if (pub.edition) {
                bibtex += `  edition = {${pub.edition}},\n`;
            }
            if (pub.isbn) {
                bibtex += `  isbn = {${pub.isbn}},\n`;
            }
        }
    }
    
    // Add abstract
    if (pub.summary) {
        const cleanAbstract = pub.summary.replace(/\n/g, ' ').replace(/\s+/g, ' ');
        bibtex += `  abstract = {${toLatex(cleanAbstract)}},\n`;
    }
    
    // Add urldate
    if (pub.published) {
        const date = new Date(pub.published);
        const urldate = date.toISOString().split('T')[0];
        bibtex += `  urldate = {${urldate}},\n`;
    }
    
    // Add keywords
    if (pub.keywords) {
        if (Array.isArray(pub.keywords)) {
            bibtex += `  keywords = {${toLatex(pub.keywords.join(', '))}},\n`;
        } else {
            bibtex += `  keywords = {${toLatex(pub.keywords)}},\n`;
        }
    }
    
    // Add coverage
    if (pub.coverage && Array.isArray(pub.coverage) && pub.coverage.length > 0) {
        const coverageText = pub.coverage.map(c => `${toLatex(c.source)}: ${c.url}`).join('; ');
        bibtex += `  note = {Featured in: ${coverageText}},\n`;
    }
    
    // Add awards
    if (pub.awards && Array.isArray(pub.awards) && pub.awards.length > 0) {
        const awardsText = pub.awards.map(a => `${toLatex(a.type)}: ${a.url}`).join('; ');
        if (pub.coverage && pub.coverage.length > 0) {
            bibtex = bibtex.slice(0, -3) + `; Awards: ${awardsText}},\n`;
        } else {
            bibtex += `  note = {Awards: ${awardsText}},\n`;
        }
    }
    
    // Remove trailing comma and close entry
    bibtex = bibtex.slice(0, -2) + '\n}\n';
    
    return bibtex;
}

/**
 * Convert array of publications to BibTeX format
 * @param {Array} data - Array of publications
 * @param {boolean} isPreprint - Whether these are preprints
 * @returns {string} Complete BibTeX string
 */
export function dataToBibTeX(data, isPreprint = false) {
    return data.map(pub => pubToBibTeX(pub, isPreprint)).join('\n');
}

/**
 * Download data as JSON file
 * @param {Array} data - Data to download
 * @param {string} filename - Output filename
 */
export function downloadJSON(data, filename) {
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

/**
 * Download data as BibTeX file
 * @param {Array} data - Array of publications
 * @param {string} filename - Output filename
 * @param {boolean} isPreprint - Whether these are preprints
 */
export function downloadBibTeX(data, filename, isPreprint = false) {
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

/**
 * Setup download button event listeners
 */
export function setupDownloadButtons() {
    const downloadJson = document.getElementById('download-publications-json');
    const downloadBib = document.getElementById('download-publications-bib');
    
    if (downloadJson) {
        downloadJson.addEventListener('click', function() {
            const timestamp = new Date().toISOString().split('T')[0];
            const currentView = state.getCurrentView();
            const data = currentView === 'preprints' ? 
                state.getFilteredPreprints() : 
                state.getFilteredPublications();
            const filename = currentView === 'preprints' ? 
                `qudyma_preprints_${timestamp}.json` : 
                `qudyma_publications_${timestamp}.json`;
            downloadJSON(data, filename);
        });
    }
    
    if (downloadBib) {
        downloadBib.addEventListener('click', function() {
            const timestamp = new Date().toISOString().split('T')[0];
            const currentView = state.getCurrentView();
            const data = currentView === 'preprints' ? 
                state.getFilteredPreprints() : 
                state.getFilteredPublications();
            const filename = currentView === 'preprints' ? 
                `qudyma_preprints_${timestamp}.bib` : 
                `qudyma_publications_${timestamp}.bib`;
            const isPreprint = currentView === 'preprints';
            downloadBibTeX(data, filename, isPreprint);
        });
    }
}
