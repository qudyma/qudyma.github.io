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
        const qudymaAuthorsMap = {};
        const qudymaAuthorsUrls = {};
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
        
        // Filter for preprints (entries without journal_ref)
        const preprints = publications.filter(pub => !pub.journal_ref);
        
        // Sort by date (most recent first)
        preprints.sort((a, b) => {
            const dateA = new Date(a.published || 0);
            const dateB = new Date(b.published || 0);
            return dateB - dateA;
        });
        
        // Generate HTML for preprints
        const container = document.getElementById('preprints-container');
        
        if (preprints.length === 0) {
            container.innerHTML = '<p>No preprints currently available.</p>';
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
                    arxivLink = `<a href="${arxivUrl}">arXiv:${arxivCode}</a>`;
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
            if (index === 0 || monthYearKey !== getCurrentMonthYearKey(preprints[index - 1])) {
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
        
        // Helper function to get month-year key
        function getCurrentMonthYearKey(pub) {
            if (!pub || !pub.published) return '';
            const date = new Date(pub.published);
            return `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
        }
        
        container.innerHTML = preprintsHtml;
        
    } catch (error) {
        console.error('Error loading preprints:', error);
        const container = document.getElementById('preprints-container');
        container.innerHTML = '<p>Error loading preprints database. Please try again later.</p>';
    }
}

// Load preprints when the page is ready
document.addEventListener('DOMContentLoaded', loadPreprints);
