// Load and display contact information for researchers in categories 01-03

// Load members data
async function loadMembers() {
    try {
        const timestamp = Math.floor(Date.now() / (1000 * 60 * 60 * 6)); // Cache-bust every 6 hours
        const url = `https://raw.githubusercontent.com/qudyma/qudyma_db/main/config/members.json?v=${timestamp}`;
        console.log('Fetching members from:', url);
        
        const response = await fetch(url);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch members database: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Data received, type:', typeof data);
        console.log('Is array:', Array.isArray(data));
        
        // members.json is an object with member IDs as keys, convert to array
        if (data && typeof data === 'object' && !Array.isArray(data)) {
            const membersArray = Object.values(data);
            console.log('Converted to array, length:', membersArray.length);
            return membersArray;
        }
        
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error loading members:', error);
        return [];
    }
}

// Format email for display (user [at] domain)
function formatEmail(email) {
    if (!email) return '';
    return email.replace('@', ' [at] ');
}

// Create contact card HTML
function createContactCard(member) {
    const email = member.email || (member.social && member.social.mail) || '';
    const office = member.office || '';
    
    return `
        <li class="person">
            <h4 class="minor">${member.name}</h4>
            <ul>
                ${email ? `<li class="icon solid fa-envelope contact-email" data-email="${email}">${formatEmail(email)}</li>` : ''}
                ${office ? `<li class="icon solid fa-home">Office ${office}</li>` : ''}
            </ul>
        </li>
    `;
}

// Setup email modal
function setupEmailModal() {
    // Create modal if it doesn't exist
    if (document.querySelector('.email-modal')) return;
    
    const modal = document.createElement('div');
    modal.className = 'email-modal';
    modal.innerHTML = `
        <div class="email-modal-overlay"></div>
        <div class="email-modal-content">
            <span class="email-modal-close">&times;</span>
            <p class="email-modal-text"></p>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Close modal on overlay click or close button
    modal.querySelector('.email-modal-overlay').addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    modal.querySelector('.email-modal-close').addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    // Close on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            modal.style.display = 'none';
        }
    });
}

// Show email modal
function showEmailModal(email) {
    const modal = document.querySelector('.email-modal');
    const modalText = modal.querySelector('.email-modal-text');
    modalText.textContent = formatEmail(email);
    modal.style.display = 'flex';
}

// Main function to load and display contacts
async function loadContacts() {
    console.log('Loading contacts...');
    
    const members = await loadMembers();
    console.log('All members loaded:', members.length);
    
    // Convert members object to array with IDs
    const membersArray = Object.entries(members).map(([id, member]) => ({
        id,
        ...member
    }));
    
    // Filter members with categories 01, 02, or 03 and status 'member'
    const contacts = membersArray.filter(member => {
        const category = parseInt(member.category);
        const isValidCategory = category >= 1 && category <= 3;
        const isMember = member.status === 'member';
        console.log(`Member: ${member.name}, Category: ${category}, Status: ${member.status}, Valid: ${isValidCategory && isMember}`);
        return isMember && isValidCategory;
    });
    
    // Sort by category (ascending), then date_in (earliest first), then id (lowest first)
    contacts.sort((a, b) => {
        // First: sort by category (ascending)
        const categoryA = parseInt(a.category) || 0;
        const categoryB = parseInt(b.category) || 0;
        if (categoryA !== categoryB) {
            return categoryA - categoryB;
        }
        
        // Second: sort by date_in (earliest to latest)
        const dateA = a.date_in || '';
        const dateB = b.date_in || '';
        if (dateA !== dateB) {
            return dateA.localeCompare(dateB);
        }
        
        // Third: sort by id (lowest to highest)
        const idA = a.id || '';
        const idB = b.id || '';
        return idA.localeCompare(idB);
    });
    
    console.log('Filtered contacts for categories 01-03:', contacts);
    
    // Find the contact list container
    const contactList = document.querySelector('ul.contact.three-col');
    if (!contactList) {
        console.error('Contact list container not found');
        return;
    }
    
    console.log('Contact list container found:', contactList);
    
    // Get existing static items (address and linkedin)
    const staticItems = Array.from(contactList.children).filter(li => 
        li.classList.contains('address') || li.classList.contains('fullwidth')
    );
    
    console.log('Static items found:', staticItems.length);
    
    // Clear the list
    contactList.innerHTML = '';
    
    // Add back static items
    staticItems.forEach(item => contactList.appendChild(item));
    
    // Add contact cards
    contacts.forEach(member => {
        console.log('Adding contact card for:', member.name);
        contactList.insertAdjacentHTML('beforeend', createContactCard(member));
    });
    
    console.log('Total items in contact list:', contactList.children.length);
    
    // Setup email modal functionality
    setupEmailModal();
    
    // Add click handlers for email items
    document.querySelectorAll('.contact-email').forEach(emailItem => {
        emailItem.style.cursor = 'pointer';
        emailItem.addEventListener('click', () => {
            const email = emailItem.getAttribute('data-email');
            showEmailModal(email);
        });
    });
    
    console.log('Contacts loaded successfully');
}

// Load contacts when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadContacts);
} else {
    // DOM is already ready
    loadContacts();
}
