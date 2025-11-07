#!/usr/bin/env node

/**
 * Simple static site builder for QUDYMA website
 * Combines template + components + pages into final HTML files
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
const ROOT_DIR = __dirname;

// Read file helper
function readFile(filepath) {
    return fs.readFileSync(filepath, 'utf-8');
}

// Write file helper
function writeFile(filepath, content) {
    fs.writeFileSync(filepath, content, 'utf-8');
    console.log(`✓ Built: ${path.basename(filepath)}`);
}

// Load components
function loadComponents() {
    const componentsDir = path.join(SRC_DIR, 'components');
    return {
        header: readFile(path.join(componentsDir, 'header.html')),
        menu: readFile(path.join(componentsDir, 'menu.html')),
        footer: readFile(path.join(componentsDir, 'footer.html')),
        publicationsStyles: readFile(path.join(componentsDir, 'publications-styles.html')),
        membersStyles: readFile(path.join(componentsDir, 'members-styles.html')),
        contactsStyles: readFile(path.join(componentsDir, 'contacts-styles.html'))
    };
}

// Load template
function loadTemplate() {
    return readFile(path.join(SRC_DIR, 'template.html'));
}

// Build a page
function buildPage(pageName, components, template) {
    const pagesDir = path.join(SRC_DIR, 'pages');
    const pageContent = readFile(path.join(pagesDir, `${pageName}.html`));
    
    // Page titles for header
    const pageTitles = {
        'members': 'Members',
        'research': 'Research',
        'software': 'Software',
        'publications': 'Publications',
        'opportunities': 'Opportunities',
        'contacts': 'Contacts'
    };
    
    // Modify header to include page title for non-index pages
    let header = components.header;
    if (pageName !== 'index' && pageTitles[pageName]) {
        header = header.replace(
            '<h1><a href="index.html"><img src="images/icons/QUDYMA_logo.png" alt="QUDYMA" class="header-logo">QUDYMA</a></h1>',
            `<h1><a href="index.html"><img src="images/icons/QUDYMA_logo.png" alt="QUDYMA" class="header-logo">QUDYMA</a> | ${pageTitles[pageName]}</h1>`
        );
    }
    
    // Add members navigation to header for members page
    if (pageName === 'members') {
        header = header.replace(
            '<nav>',
            `<div id="members-header-nav">
		<ul>
			<li><a href="#members-section">Active Members</a></li>
			<li><a href="#former-members-section">Former Members</a></li>
			<li><a href="#visitors-section">Visitors</a></li>
			<li><a href="#former-visitors-section">Former Visitors</a></li>
		</ul>
	</div>
	<nav>`
        );
    }
    
    // Page-specific configurations
    const pageConfig = {
        'index': {
            headExtra: '',
            scriptsExtra: ''
        },
        'members': {
            headExtra: components.membersStyles,
            scriptsExtra: ''
        },
        'publications': {
            headExtra: components.publicationsStyles,
            scriptsExtra: '<script src="assets/js/publications-bundle.js"></script>'
        },
        'contacts': {
            headExtra: components.contactsStyles,
            scriptsExtra: ''
        }
    };
    
    const config = pageConfig[pageName] || { headExtra: '', scriptsExtra: '' };
    
    // Replace placeholders
    let html = template
        .replace('{{HEADER}}', header)
        .replace('{{MENU}}', components.menu)
        .replace('{{CONTENT}}', pageContent)
        .replace('{{FOOTER}}', components.footer)
        .replace('{{HEAD_EXTRA}}', config.headExtra)
        .replace('{{SCRIPTS_EXTRA}}', config.scriptsExtra);
    
    // Replace page-specific placeholders in content
    if (pageName === 'members') {
        html = html.replace('{{MEMBERS_STYLES}}', components.membersStyles);
    }
    
    // Add index-banner class to index page banner and body
    if (pageName === 'index') {
        html = html.replace('<section id="banner">', '<section id="banner" class="index-banner">');
        html = html.replace('<body class="is-preload">', '<body class="is-preload index-page">');
    }
    
    // Write to root directory
    const outputPath = path.join(ROOT_DIR, `${pageName}.html`);
    writeFile(outputPath, html);
}

// Main build function
function build() {
    console.log('🔨 Building QUDYMA website...\n');
    
    const components = loadComponents();
    const template = loadTemplate();
    
    // List of pages to build
    const pages = [
        'index',
        'members', 
        'research',
        'software',
        'publications',
        'opportunities',
        'contacts'
    ];
    
    pages.forEach(page => {
        buildPage(page, components, template);
    });
    
    console.log('\n✨ Build complete!');
}

// Run build
build();
