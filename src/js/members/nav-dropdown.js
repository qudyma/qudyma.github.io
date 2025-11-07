// Members navigation dropdown logic
export function setupMembersDropdown() {
    function checkNavOverflow() {
        const nav = document.getElementById('members-header-nav');
        const dropdownToggle = document.getElementById('members-dropdown-toggle');
        if (!nav || !dropdownToggle) return;
        const header = document.getElementById('header');
        const navRect = nav.getBoundingClientRect();
        const headerRect = header.getBoundingClientRect();
        // If nav overflows header width, show dropdown icon and hide menu
        if (navRect.right > headerRect.right - 20 || navRect.left < headerRect.left + 20) {
            nav.classList.add('dropdown');
            dropdownToggle.style.display = 'inline-block';
        } else {
            nav.classList.remove('dropdown');
            dropdownToggle.style.display = 'none';
        }
    }

    function toggleDropdownMenu() {
        let menu = document.getElementById('members-dropdown-menu');
        if (menu) {
            // Toggle menu visibility
            if (menu.classList.contains('show')) {
                menu.classList.remove('show');
                setTimeout(() => {
                    if (menu.parentNode) menu.parentNode.removeChild(menu);
                }, 300);
                return;
            } else {
                menu.classList.add('show');
                return;
            }
        }
        // Build dropdown menu from members-header-nav ul
        const nav = document.getElementById('members-header-nav');
        if (!nav) return;
        const ul = nav.querySelector('ul');
        if (!ul) return;
        menu = document.createElement('ul');
        menu.className = 'dropdown-menu show';
        menu.id = 'members-dropdown-menu';
        menu.style.listStyle = 'none';
        Array.from(ul.children).forEach(li => {
            const newLi = li.cloneNode(true);
            newLi.style.listStyle = 'none';
            menu.appendChild(newLi);
        });
        // Attach menu to header nav (not nav)
        const headerNav = document.querySelector('#header nav');
        headerNav.insertBefore(menu, headerNav.querySelector('#menu'));
        // Hide menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function handler(ev) {
                if (!menu.contains(ev.target) && ev.target !== document.getElementById('members-dropdown-toggle')) {
                    menu.classList.remove('show');
                    setTimeout(() => {
                        if (menu.parentNode) menu.parentNode.removeChild(menu);
                    }, 300);
                    document.removeEventListener('click', handler);
                }
            });
        }, 0);
        // Ensure menu is within screen bounds
        setTimeout(() => {
            const rect = menu.getBoundingClientRect();
            if (rect.right > window.innerWidth) {
                menu.style.left = 'auto';
                menu.style.right = '0';
            }
            if (rect.left < 0) {
                menu.style.left = '0';
                menu.style.right = 'auto';
            }
        }, 10);
    }

    document.addEventListener('DOMContentLoaded', function() {
        window.addEventListener('resize', checkNavOverflow);
        checkNavOverflow();
        const dropdownToggle = document.getElementById('members-dropdown-toggle');
        if (dropdownToggle) {
            dropdownToggle.addEventListener('click', function(e) {
                e.preventDefault();
                toggleDropdownMenu();
            });
        }
    });
}

setupMembersDropdown();
