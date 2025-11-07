/**
 * Members page dynamic loader
 * Loads member data from members.json and categories.json databases
 */

/**
 * Load members data from database
 * @returns {Promise<Object>} Members data keyed by ID
 */
async function loadMembers() {
    const timestamp = Math.floor(Date.now() / (1000 * 60 * 60 * 6)); // Cache-bust every 6 hours
    const url = `https://raw.githubusercontent.com/qudyma/qudyma_db/main/config/members.json?v=${timestamp}`;
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`Failed to fetch members database: ${response.status}`);
    }
    
    return await response.json();
}

/**
 * Load categories data from database
 * @returns {Promise<Object>} Categories data
 */
async function loadCategories() {
    const timestamp = Math.floor(Date.now() / (1000 * 60 * 60 * 6)); // Cache-bust every 6 hours
    const url = `https://raw.githubusercontent.com/qudyma/qudyma_db/main/config/categories.json?v=${timestamp}`;
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`Failed to fetch categories database: ${response.status}`);
    }
    
    return await response.json();
}

/**
 * Get category title by category code and member status
 * @param {string} categoryCode - Category code (e.g., "02")
 * @param {Object} categories - Categories object with member and visitor sublists
 * @param {string} status - Member status ('member' or 'visitor')
 * @returns {string} Category title
 */
function getCategoryTitle(categoryCode, categories, status) {
    // Select the appropriate category list based on status
    const categoryList = status === 'visitor' ? categories.visitor : categories.member;
    
    if (!categoryList) return '';
    
    const category = Object.values(categoryList).find(cat => cat.order === categoryCode);
    return category ? category.title : '';
}

/**
 * Build social links HTML
 * @param {Object} member - Member data
 * @param {string} memberId - Member ID for unique modal identification
 * @returns {string} HTML string for social links
 */
function buildSocialLinks(member, memberId) {
    // Don't show social icons for former members, visitors, or former visitors
    const hasLeft = member.date_out !== null && member.date_out !== undefined;
    const isVisitor = member.status === 'visitor';
    
    if (hasLeft || isVisitor) {
        // Return empty paragraph for alignment
        return '<p>&nbsp;</p>';
    }
    
    const links = [];
    
    // Email modal trigger (using social.mail)
    if (member.social && member.social.mail) {
        const emailParts = member.social.mail.split('@');
        const formattedEmail = emailParts.length === 2 ? `${emailParts[0]} [at] ${emailParts[1]}` : member.social.mail;
        links.push(`<a href="#" class="email-trigger" data-member-id="${memberId}" data-email="${formattedEmail}"><span class="fas fa-envelope"></span></a>`);
    }
    
    // Personal website
    if (member.social && member.social.web) {
        links.push(`<a href="${member.social.web}"><span class="fas fa-user"></span></a>`);
    }
    
    // Google Scholar
    if (member.social && member.social.google_scholar) {
        links.push(`<a href="${member.social.google_scholar}"><span class="icon solid GoogleScholar"></span></a>`);
    }
    
    // GitHub
    if (member.social && member.social.github) {
        links.push(`<a href="${member.social.github}"><span class="icon brands fa-github"></span></a>`);
    }
    
    // LinkedIn
    if (member.social && member.social.linkedin) {
        links.push(`<a href="${member.social.linkedin}"><span class="icon brands fa-linkedin"></span></a>`);
    }
    
    // Always return a paragraph, even if empty, for alignment
    const content = links.length > 0 ? links.join('\n\t\t\t\t\t\t&nbsp;\n\t\t\t\t\t\t') : '&nbsp;';
    return `<p>${content}</p>`;
}

/**
 * Build additional description text
 * @param {Object} member - Member data
 * @param {Object} categories - Categories object
 * @returns {string} Description text
 */
function buildDescription(member, categories) {
    const parts = [];
    
    // Category title
    let categoryTitle = '';
    if (member.category !== undefined) {
        categoryTitle = getCategoryTitle(member.category, categories, member.status);
        if (categoryTitle) {
            parts.push(categoryTitle);
        }
    }
    
    // Supervisors/collaborators based on category and status
    if (member.category && member.supervisors && member.supervisors.length > 0) {
        const categoryNum = parseInt(member.category);
        let prefix = null;
        
        if (member.status === 'visitor') {
            // For visitors: category 02 = "working with", category 03 = "supervised by"
            if (categoryNum === 2) {
                prefix = 'working with ';
            } else if (categoryNum === 3) {
                prefix = 'supervised by ';
            }
        } else {
            // For members: category 07 = "working with", category 08+ = "supervised by"
            if (categoryNum === 7) {
                prefix = 'working with ';
            } else if (categoryNum >= 8) {
                prefix = 'supervised by ';
            }
        }
        
        if (prefix) {
            let supervisorText = prefix;
            if (member.supervisors.length === 1) {
                supervisorText += member.supervisors[0];
            } else if (member.supervisors.length === 2) {
                supervisorText += member.supervisors[0] + ' and ' + member.supervisors[1];
            } else {
                // More than 2: comma-separated with "and" before the last one
                const allButLast = member.supervisors.slice(0, -1).join(', ');
                const last = member.supervisors[member.supervisors.length - 1];
                supervisorText += allButLast + ' and ' + last;
            }
            parts.push(supervisorText);
        }
    }
    
    // Defense date and current position (for former members)
    if (member.date_out) {
        if (member.defense_date) {
            // Format defense date as "Mon Year" (e.g., "Apr 2024")
            const date = new Date(member.defense_date);
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const formattedDate = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            parts.push(`defended in ${formattedDate}`);
        }
        // Note: current position is handled separately in the card HTML
    }
    
    return parts.join(', ');
}

/**
 * Create member card HTML with overlayed images
 * @param {string} memberId - Member ID
 * @param {Object} member - Member data
 * @param {Object} categories - Categories object
 * @returns {string} HTML string for member card
 */

// Store member publication info globally after loading
let memberHasPublications = {};

function createMemberCard(memberId, member, categories) {
    const memberImagePath = `images/members/${memberId}.png`;
    const backgroundImagePath = `images/members/background.png`;
    const description = buildDescription(member, categories);
    const socialLinks = buildSocialLinks(member, memberId);

    // Build "Currently at" text for former members
    let currentlyAt = '';
    if (member.date_out && member.current) {
        currentlyAt = `<p>Currently at ${member.current}</p>`;
    }

    // Build home institution text for visitors
    let homeInstitution = '';
    if (member.status === 'visitor' && member.home) {
        homeInstitution = `<p>${member.home}</p>`;
    }

    // Build dates for visitors
    let visitorDates = '';
    if (member.status === 'visitor') {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        if (member.date_out) {
            // Former visitor: show date range
            const dateIn = new Date(member.date_in);
            const dateOut = new Date(member.date_out);
            const dateInStr = `${monthNames[dateIn.getMonth()]} ${dateIn.getFullYear()}`;
            const dateOutStr = `${monthNames[dateOut.getMonth()]} ${dateOut.getFullYear()}`;
            visitorDates = `<p>${dateInStr} - ${dateOutStr}</p>`;
        } else {
            // Current visitor: show "Since..."
            const dateIn = new Date(member.date_in);
            const dateInStr = `${monthNames[dateIn.getMonth()]} ${dateIn.getFullYear()}`;
            visitorDates = `<p>Since ${dateInStr}</p>`;
        }
    }

    // Determine member type
    const isVisitor = member.status === 'visitor';
    const isFormer = member.date_out !== null && member.date_out !== undefined;
    const isActiveMember = !isVisitor && !isFormer;

    // Publications button logic
    let publicationsButton = '';
    if (isActiveMember) {
        publicationsButton = `<a class="member-publications-btn special" href="/publications.html?view=published&authorId=${encodeURIComponent(memberId)}">Publications</a>`;
    } else if (!isVisitor && isFormer) {
        // For former members only (not visitors), show button with authorName
        publicationsButton = `<a class="member-publications-btn special" href="/publications.html?view=published&authorName=${encodeURIComponent(member.name)}">Publications</a>`;
    }
    // Social icons (full width) only for active members
    let socialsRow = '';
    let publicationsRow = '';
    if (isActiveMember) {
        socialsRow = `<div class="member-card-social-full">${socialLinks}</div>`;
        publicationsRow = `<div class="member-card-publications-row">${publicationsButton}</div>`;
    } else if (!isVisitor && isFormer) {
        // For former members, show publications button only
        publicationsRow = `<div class="member-card-publications-row">${publicationsButton}</div>`;
    }
    // For visitors and former visitors, do not show or reserve space for socials/publications

    // Determine profile link (website > google scholar > none)
    let profileUrl = '';
    if (member.social && member.social.web) {
        profileUrl = member.social.web;
    } else if (member.social && member.social.google_scholar) {
        profileUrl = member.social.google_scholar;
    }

    // Build clickable image and name if profileUrl exists
    let imageBlock = '';
    let nameBlock = '';
    if (profileUrl) {
        imageBlock = `<a class="image member-image-container" href="${profileUrl}" target="_blank" rel="noopener">
            <img src="${backgroundImagePath}" class="member-background" alt="" />
            <img src="${memberImagePath}" class="member-photo" alt="${member.name}" />
        </a>`;
        nameBlock = `<h3 class="major"><a href="${profileUrl}" target="_blank" rel="noopener">${member.name}</a></h3>`;
    } else {
        imageBlock = `<a class="image member-image-container" style="pointer-events:none;cursor:default;">
            <img src="${backgroundImagePath}" class="member-background" alt="" />
            <img src="${memberImagePath}" class="member-photo" alt="${member.name}" />
        </a>`;
        nameBlock = `<h3 class="major">${member.name}</h3>`;
    }

    return `
        <article>
            ${imageBlock}
            ${nameBlock}
            ${description ? `<p>${description}</p>` : ''}
            ${homeInstitution}
            ${visitorDates}
            ${currentlyAt}
            ${socialsRow}
            ${publicationsRow}
        </article>`;
}

/**
 * Categorize members into groups
 * @param {Object} membersData - Members data keyed by ID
 * @returns {Object} Categorized members
 */
function categorizeMembers(membersData) {
    const groups = {
        members: [],           // status='member', no date_out
        formerMembers: [],     // status='member', has date_out
        visitors: [],          // status='visitor', no date_out
        formerVisitors: []     // status='visitor', has date_out
    };
    
    Object.entries(membersData).forEach(([id, member]) => {
        const hasLeft = member.date_out !== null && member.date_out !== undefined;
        const isVisitor = member.status === 'visitor';
        
        if (isVisitor) {
            if (hasLeft) {
                groups.formerVisitors.push({ id, ...member });
            } else {
                groups.visitors.push({ id, ...member });
            }
        } else {
            if (hasLeft) {
                groups.formerMembers.push({ id, ...member });
            } else {
                groups.members.push({ id, ...member });
            }
        }
    });
    
    return groups;
}

/**
 * Sort members by category order, then date (earliest first), then id (lowest first)
 * @param {Array} members - Array of members to sort
 * @param {boolean} useDefenseDate - If true, prefer defense_date over date_in (fallback to date_in if defense_date doesn't exist)
 * @returns {Array} Sorted members
 */
function sortMembers(members, useDefenseDate = false) {
    return members.sort((a, b) => {
        // First: sort by category (ascending)
        const categoryA = parseInt(a.category) || 0;
        const categoryB = parseInt(b.category) || 0;
        if (categoryA !== categoryB) {
            return categoryA - categoryB;
        }
        
        // Second: sort by date (earliest to latest)
        // For former members: use defense_date if available, otherwise date_in
        // For others: use date_in
        let dateA, dateB;
        if (useDefenseDate) {
            dateA = a.defense_date || a.date_in || '';
            dateB = b.defense_date || b.date_in || '';
        } else {
            dateA = a.date_in || '';
            dateB = b.date_in || '';
        }
        
        if (dateA !== dateB) {
            return dateA.localeCompare(dateB);
        }
        
        // Third: sort by id (lowest to highest)
        const idA = a.id || '';
        const idB = b.id || '';
        return idA.localeCompare(idB);
    });
}

/**
 * Render members section
 * @param {string} containerId - Container element ID
 * @param {Array} members - Array of members
 * @param {Object} categories - Categories object
 * @param {string} title - Section title
 */
function renderSection(containerId, members, categories, title) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (members.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    const titleElement = container.querySelector('.major');
    if (titleElement) {
        titleElement.textContent = title;
    }
    
    const featuresSection = container.querySelector('.features');
    if (featuresSection) {
        featuresSection.innerHTML = members
            .map(member => createMemberCard(member.id, member, categories))
            .join('\n');
        // Center cards if only one fits per row (responsive)
        function updateCardCentering() {
            const minCardWidth = 250; // px, matches CSS min-width
            const sectionWidth = featuresSection.offsetWidth;
            const cardsPerRow = Math.floor(sectionWidth / minCardWidth);
            if (cardsPerRow <= 1) {
                featuresSection.classList.add('single-card');
            } else {
                featuresSection.classList.remove('single-card');
            }
        }
        updateCardCentering();
        window.addEventListener('resize', updateCardCentering);
    }
}

/**
 * Initialize members page
 */
async function init() {
    try {
        // Load data
        const [membersData, categories] = await Promise.all([
            loadMembers(),
            loadCategories()
        ]);

        // Fetch publications and build memberHasPublications map
        memberHasPublications = {};
        try {
            const publicationsResp = await fetch('https://raw.githubusercontent.com/qudyma/qudyma_db/main/data/publications.json');
            if (publicationsResp.ok) {
                const publicationsData = await publicationsResp.json();
                const entries = publicationsData.entries || [];
                entries.forEach(pub => {
                    if (Array.isArray(pub.author_ids)) {
                        pub.author_ids.forEach(id => {
                            memberHasPublications[id] = true;
                        });
                    }
                });
            }
        } catch (e) {
            console.warn('Could not load publications for member cards:', e);
        }

        // Categorize members
        const groups = categorizeMembers(membersData);

        // Sort all groups by category, date, and id
        // Former members use defense_date, others use date_in
        sortMembers(groups.members, false);
        sortMembers(groups.formerMembers, true);  // Use defense_date for former members
        sortMembers(groups.visitors, false);
        sortMembers(groups.formerVisitors, false);

        // Render each section
        renderSection('members-section', groups.members, categories, 'Active Members');
        renderSection('former-members-section', groups.formerMembers, categories, 'Former Members');
        renderSection('visitors-section', groups.visitors, categories, 'Visitors');
        renderSection('former-visitors-section', groups.formerVisitors, categories, 'Former Visitors');

        console.log('Members page loaded successfully');
        console.log('Active members:', groups.members.length);
        console.log('Former members:', groups.formerMembers.length);
        console.log('Visitors:', groups.visitors.length);
        console.log('Former visitors:', groups.formerVisitors.length);

        // Set up email modal functionality
        setupEmailModal();

    } catch (error) {
        console.error('Error loading members page:', error);
        document.querySelector('#wrapper').innerHTML = '<div class="inner"><p>Error loading members data. Please try again later.</p></div>';
    }
}

/**
 * Setup email modal functionality
 */
function setupEmailModal() {
    // Create modal if it doesn't exist
    if (!document.getElementById('email-modal')) {
        const modal = document.createElement('div');
        modal.id = 'email-modal';
        modal.className = 'email-modal';
        modal.innerHTML = `
            <div class="email-modal-overlay"></div>
            <div class="email-modal-content">
                <span class="email-modal-close">&times;</span>
                <p id="email-modal-text"></p>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    const modal = document.getElementById('email-modal');
    const modalText = document.getElementById('email-modal-text');
    const closeBtn = modal.querySelector('.email-modal-close');
    const overlay = modal.querySelector('.email-modal-overlay');
    
    // Close modal function
    const closeModal = () => {
        modal.style.display = 'none';
    };
    
    // Close button click
    closeBtn.addEventListener('click', closeModal);
    
    // Overlay click
    overlay.addEventListener('click', closeModal);
    
    // ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeModal();
        }
    });
    
        // Email trigger clicks (direct listeners only for .email-trigger)
        document.querySelectorAll('.email-trigger').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                const email = trigger.dataset.email;
                modalText.textContent = email;
                modal.style.display = 'flex';
            });
        });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
