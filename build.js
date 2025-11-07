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
        publicationsStyles: readFile(path.join(componentsDir, 'publications-styles.html'))
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
    
    // Page-specific configurations
    const pageConfig = {
        'index': {
            headExtra: '',
            scriptsExtra: ''
        },
        'publications': {
            headExtra: components.publicationsStyles,
            scriptsExtra: '<script src="assets/js/publications-bundle.js"></script>'
        }
    };
    
    const config = pageConfig[pageName] || { headExtra: '', scriptsExtra: '' };
    
    // Replace placeholders
    let html = template
        .replace('{{HEADER}}', components.header)
        .replace('{{MENU}}', components.menu)
        .replace('{{CONTENT}}', pageContent)
        .replace('{{FOOTER}}', components.footer)
        .replace('{{HEAD_EXTRA}}', config.headExtra)
        .replace('{{SCRIPTS_EXTRA}}', config.scriptsExtra);
    
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
