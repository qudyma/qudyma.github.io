(() => {
  // src/js/publications/state.js
  var state = {
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
    canonicalNameToId: {},
    // map canonical author name -> author id from members.json
    // Filter and view state
    selectedFilters: /* @__PURE__ */ new Set(),
    // Single filter set shared across both views
    yearRange: { min: 2020, max: (/* @__PURE__ */ new Date()).getFullYear() },
    // Single year range shared across both views
    dynamicMinYear: 2020,
    // Will be calculated from data (allows going earlier if user changes it)
    absoluteMinYear: 2020,
    // Absolute minimum available in database (for validation)
    currentView: "preprints"
    // Track current view: 'preprints' or 'publications'
  };
  var getAllPreprints = () => state.allPreprints;
  var setAllPreprints = (preprints) => {
    state.allPreprints = preprints;
  };
  var getAllPublications = () => state.allPublications;
  var setAllPublications = (publications) => {
    state.allPublications = publications;
  };
  var getFilteredPreprints = () => state.filteredPreprints;
  var setFilteredPreprints = (preprints) => {
    state.filteredPreprints = preprints;
  };
  var getFilteredPublications = () => state.filteredPublications;
  var setFilteredPublications = (publications) => {
    state.filteredPublications = publications;
  };
  var getQudymaAuthorsMap = () => state.qudymaAuthorsMap;
  var setQudymaAuthorsMap = (map) => {
    state.qudymaAuthorsMap = map;
  };
  var getQudymaAuthorsUrls = () => state.qudymaAuthorsUrls;
  var setQudymaAuthorsUrls = (urls) => {
    state.qudymaAuthorsUrls = urls;
  };
  var getActiveMembers = () => state.activeMembers;
  var setActiveMembers = (members) => {
    state.activeMembers = members;
  };
  var getCanonicalNameToId = () => state.canonicalNameToId;
  var setCanonicalNameToId = (map) => {
    state.canonicalNameToId = map;
  };
  var getSelectedFilters = () => state.selectedFilters;
  var addFilter = (filter) => {
    state.selectedFilters.add(filter);
  };
  var removeFilter = (filter) => {
    state.selectedFilters.delete(filter);
  };
  var clearFilters = () => {
    state.selectedFilters.clear();
  };
  var getYearRange = () => state.yearRange;
  var setMinYear = (min) => {
    state.yearRange.min = min;
  };
  var setMaxYear = (max) => {
    state.yearRange.max = max;
  };
  var getDynamicMinYear = () => state.dynamicMinYear;
  var setDynamicMinYear = (year) => {
    state.dynamicMinYear = year;
  };
  var setAbsoluteMinYear = (year) => {
    state.absoluteMinYear = year;
  };
  var getCurrentView = () => state.currentView;
  var setCurrentView = (view) => {
    state.currentView = view;
  };

  // src/js/publications/utils.js
  function normalizeText(text) {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  function formatAuthorAsInitials(fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) return fullName;
    const surname = parts[parts.length - 1];
    const initials = parts.slice(0, -1).map((part) => {
      return part.charAt(0).toUpperCase() + ".";
    }).join(" ");
    return initials ? `${initials} ${surname}` : surname;
  }
  function extractPublicationYear(pub) {
    if (pub.journal_ref) {
      const yearMatches = pub.journal_ref.match(/\((\d{4})\)/g);
      if (yearMatches && yearMatches.length > 0) {
        const lastMatch = yearMatches[yearMatches.length - 1];
        const yearExtract = lastMatch.match(/\((\d{4})\)/);
        if (yearExtract) {
          return yearExtract[1];
        }
      }
    }
    if (pub.published) {
      const date = new Date(pub.published);
      return date.getFullYear().toString();
    }
    return "";
  }
  function toLatex(text) {
    if (!text) return text;
    const replacements = {
      // Accented vowels - acute
      "\xE1": "\\'a",
      "\xE9": "\\'e",
      "\xED": "\\'i",
      "\xF3": "\\'o",
      "\xFA": "\\'u",
      "\xC1": "\\'A",
      "\xC9": "\\'E",
      "\xCD": "\\'I",
      "\xD3": "\\'O",
      "\xDA": "\\'U",
      "\xFD": "\\'y",
      "\xDD": "\\'Y",
      // Accented vowels - grave
      "\xE0": "\\`a",
      "\xE8": "\\`e",
      "\xEC": "\\`i",
      "\xF2": "\\`o",
      "\xF9": "\\`u",
      "\xC0": "\\`A",
      "\xC8": "\\`E",
      "\xCC": "\\`I",
      "\xD2": "\\`O",
      "\xD9": "\\`U",
      // Accented vowels - circumflex
      "\xE2": "\\^a",
      "\xEA": "\\^e",
      "\xEE": "\\^i",
      "\xF4": "\\^o",
      "\xFB": "\\^u",
      "\xC2": "\\^A",
      "\xCA": "\\^E",
      "\xCE": "\\^I",
      "\xD4": "\\^O",
      "\xDB": "\\^U",
      // Accented vowels - umlaut/diaeresis
      "\xE4": '\\"a',
      "\xEB": '\\"e',
      "\xEF": '\\"i',
      "\xF6": '\\"o',
      "\xFC": '\\"u',
      "\xC4": '\\"A',
      "\xCB": '\\"E',
      "\xCF": '\\"I',
      "\xD6": '\\"O',
      "\xDC": '\\"U',
      "\xFF": '\\"y',
      "\u0178": '\\"Y',
      // Accented vowels - tilde
      "\xE3": "\\~a",
      "\xF5": "\\~o",
      "\xF1": "\\~n",
      "\xC3": "\\~A",
      "\xD5": "\\~O",
      "\xD1": "\\~N",
      // Other diacritics
      "\xE7": "\\c{c}",
      "\xC7": "\\c{C}",
      "\xF8": "\\o",
      "\xD8": "\\O",
      "\xE5": "\\aa",
      "\xC5": "\\AA",
      "\xE6": "\\ae",
      "\xC6": "\\AE",
      "\u0153": "\\oe",
      "\u0152": "\\OE",
      "\xDF": "\\ss",
      "\u0142": "\\l",
      "\u0141": "\\L",
      // Slavic characters
      "\u0161": "\\v{s}",
      "\u0160": "\\v{S}",
      "\u010D": "\\v{c}",
      "\u010C": "\\v{C}",
      "\u017E": "\\v{z}",
      "\u017D": "\\v{Z}",
      "\u0159": "\\v{r}",
      "\u0158": "\\v{R}",
      "\u011B": "\\v{e}",
      "\u011A": "\\v{E}",
      "\u016F": "\\r{u}",
      "\u016E": "\\r{U}",
      // Polish characters
      "\u0105": "\\k{a}",
      "\u0104": "\\k{A}",
      "\u0119": "\\k{e}",
      "\u0118": "\\k{E}",
      "\u0144": "\\'n",
      "\u0143": "\\'N",
      "\u015B": "\\'s",
      "\u015A": "\\'S",
      "\u017A": "\\'z",
      "\u0179": "\\'Z",
      "\u017C": "\\.z",
      "\u017B": "\\.Z",
      // Hungarian characters
      "\u0151": "\\H{o}",
      "\u0150": "\\H{O}",
      "\u0171": "\\H{u}",
      "\u0170": "\\H{U}",
      // Special symbols
      "\xB0": "\\textdegree",
      "\u20AC": "\\euro",
      "\xA3": "\\pounds",
      "\xA7": "\\S",
      "\xB6": "\\P",
      "\u2020": "\\dag",
      "\u2021": "\\ddag",
      "\xA9": "\\copyright",
      "\xAE": "\\textregistered",
      "\u2122": "\\texttrademark"
    };
    let result = text;
    for (const [char, latex] of Object.entries(replacements)) {
      result = result.split(char).join(latex);
    }
    return result;
  }
  function updateResultsCounter(count) {
    const counter = document.querySelector(".search-results-counter");
    if (counter) {
      counter.textContent = count + " result" + (count !== 1 ? "s" : "");
    }
  }

  // src/js/publications/data-loader.js
  async function loadAuthorsConfig() {
    const basicsTimestamp = Math.floor(Date.now() / (1e3 * 60 * 60 * 6));
    const configUrl = `https://raw.githubusercontent.com/qudyma/qudyma_db/main/config/members.json?v=${basicsTimestamp}`;
    const configResponse = await fetch(configUrl);
    if (!configResponse.ok) {
      throw new Error(`Failed to fetch QUDYMA members config: ${configResponse.status}`);
    }
    const configData = await configResponse.json();
    const qudymaAuthorsMap = {};
    const qudymaAuthorsUrls = {};
    const canonicalNameToId = {};
    const activeMembers = [];
    Object.entries(configData).forEach(([authorId, member]) => {
      if (member && member.name) {
        const canonical = member.name;
        qudymaAuthorsMap[canonical.toLowerCase()] = canonical;
        canonicalNameToId[canonical] = authorId;
        if (member.social) {
          const url = member.social.web || member.social.google_scholar;
          if (url) {
            qudymaAuthorsUrls[canonical.toLowerCase()] = url;
          }
        }
        if (member.date_in && !member.date_out && member.status === "member") {
          activeMembers.push(canonical);
        }
        if (member.name_variants) {
          member.name_variants.forEach((variant) => {
            qudymaAuthorsMap[variant.toLowerCase()] = canonical;
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
    setQudymaAuthorsMap(qudymaAuthorsMap);
    setQudymaAuthorsUrls(qudymaAuthorsUrls);
    setCanonicalNameToId(canonicalNameToId);
    setActiveMembers(activeMembers);
    return configData;
  }
  async function loadPublications() {
    const publicationsTimestamp = Math.floor(Date.now() / (1e3 * 60 * 60));
    const dbUrl = `https://raw.githubusercontent.com/qudyma/qudyma_db/main/data/publications.json?v=${publicationsTimestamp}`;
    const response = await fetch(dbUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch publications database: ${response.status}`);
    }
    const data = await response.json();
    const publications = data.entries || [];
    console.log("Total entries:", publications.length);
    console.log("Entries with arxiv_url:", publications.filter((p) => p.arxiv_url).length);
    console.log("Entries with journal_ref:", publications.filter((p) => p.journal_ref).length);
    console.log("Entries with arxiv_url AND NO journal_ref:", publications.filter((p) => p.arxiv_url && !p.journal_ref).length);
    console.log("Entries with arxiv_url AND journal_ref:", publications.filter((p) => p.arxiv_url && p.journal_ref).length);
    calculateMinYear(publications);
    return publications;
  }
  function calculateMinYear(publications) {
    const years = publications.map((pub) => {
      if (pub.published) {
        return parseInt(pub.published.substring(0, 4));
      }
      return null;
    }).filter((year) => year !== null);
    if (years.length > 0) {
      const minYear = Math.min(...years);
      console.log("Absolute min year from database:", minYear);
      setAbsoluteMinYear(minYear);
      setDynamicMinYear(minYear);
    }
  }
  function processPublications(publications) {
    const preprints = publications.filter((pub) => !pub.journal_ref && pub.arxiv_url);
    const published = publications.filter((pub) => pub.journal_ref);
    preprints.sort((a, b) => {
      const dateA = new Date(a.published || 0);
      const dateB = new Date(b.published || 0);
      return dateB - dateA;
    });
    published.sort((a, b) => {
      const yearA = extractPublicationYear(a);
      const yearB = extractPublicationYear(b);
      if (yearA !== yearB) {
        return parseInt(yearB) - parseInt(yearA);
      }
      const dateA = new Date(a.published || 0);
      const dateB = new Date(b.published || 0);
      return dateB - dateA;
    });
    return { preprints, published };
  }
  async function loadAllData() {
    try {
      await loadAuthorsConfig();
      const publications = await loadPublications();
      const { preprints, published } = processPublications(publications);
      setAllPreprints(preprints);
      setAllPublications(published);
      setFilteredPreprints(preprints);
      setFilteredPublications(published);
      console.log("Data loaded successfully");
      console.log("Preprints:", preprints.length);
      console.log("Published:", published.length);
    } catch (error) {
      console.error("Error loading data:", error);
      throw error;
    }
  }

  // src/js/publications/display.js
  function formatAuthors(authorsList) {
    const qudymaAuthorsMap = getQudymaAuthorsMap();
    const qudymaAuthorsUrls = getQudymaAuthorsUrls();
    return authorsList.split(", ").map((author) => {
      const authorLower = author.toLowerCase().trim();
      const canonicalName = qudymaAuthorsMap[authorLower];
      if (canonicalName) {
        const url = qudymaAuthorsUrls[authorLower];
        if (url) {
          return `<u><a href="${url}" style="color: inherit; text-decoration: none !important; border-bottom: none !important;">${canonicalName}</a></u>`;
        } else {
          return `<u>${canonicalName}</u>`;
        }
      } else {
        const formattedAuthor = formatAuthorAsInitials(author);
        const arxivUrl = `https://arxiv.org/search/?query=${encodeURIComponent(author)}&searchtype=all&abstracts=show&order=-announced_date_first&size=50`;
        return `<a href="${arxivUrl}" style="color: inherit; text-decoration: none !important; border-bottom: none !important;">${formattedAuthor}</a>`;
      }
    }).join(", ");
  }
  function displayPreprints(preprints) {
    const container = document.getElementById("publications-container");
    const preprintsList = preprints || getFilteredPreprints();
    if (preprintsList.length === 0) {
      container.innerHTML = "<p>No preprints match your search.</p>";
      return;
    }
    const preprintsHtml = preprintsList.map((pub, index) => {
      const authorsFormatted = formatAuthors(pub.authors);
      let arxivLink = "";
      let arxivUrl = "";
      if (pub.id) {
        const arxivMatch = pub.id.match(/arxiv\.org\/abs\/(\d+\.\d+)/);
        if (arxivMatch) {
          const arxivCode = arxivMatch[1];
          arxivUrl = pub.arxiv_url || pub.id;
          let arxivYear = "";
          if (pub.published) {
            const date = new Date(pub.published);
            arxivYear = date.getFullYear().toString();
          }
          arxivLink = `<a href="${arxivUrl}">arXiv:${arxivCode} (${arxivYear})</a>`;
        }
      }
      let submissionDate = "";
      let monthYearKey = "";
      if (pub.published) {
        const date = new Date(pub.published);
        const options = { year: "numeric", month: "long" };
        submissionDate = date.toLocaleDateString("en-US", options);
        monthYearKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, "0")}`;
      }
      let monthHeader = "";
      let prevMonthYearKey = "";
      if (index > 0 && preprintsList[index - 1].published) {
        const prevDate = new Date(preprintsList[index - 1].published);
        prevMonthYearKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth()).padStart(2, "0")}`;
      }
      if (index === 0 || monthYearKey !== prevMonthYearKey) {
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
    }).join("");
    container.innerHTML = preprintsHtml;
    const preprintsWrapper = document.getElementById("preprints-scroll-wrapper");
    if (preprintsWrapper) {
      preprintsWrapper.style.overflowY = "scroll";
    }
  }
  function displayPublications(publications) {
    const container = document.getElementById("publications-container");
    const publicationsList = publications || getFilteredPublications();
    if (publicationsList.length === 0) {
      container.innerHTML = "<p>No publications match your search.</p>";
      return;
    }
    const publicationsHtml = publicationsList.map((pub, index) => {
      const authorsFormatted = formatAuthors(pub.authors);
      let journalLink = "";
      let doiUrl = "";
      if (pub.journal_url) {
        doiUrl = pub.journal_url;
        let displayJournalRef = pub.journal_ref;
        if (!pub.journal_ref.match(/\(\d{4}\)\s*$/)) {
          let publishedYear = "";
          if (pub.published) {
            const date = new Date(pub.published);
            publishedYear = date.getFullYear().toString();
          }
          if (publishedYear) {
            displayJournalRef = `${pub.journal_ref} (${publishedYear})`;
          }
        }
        journalLink = `<a href="${pub.journal_url}" style="color: inherit; ">${displayJournalRef}</a>`;
      } else if (pub.journal_ref) {
        let displayJournalRef = pub.journal_ref;
        if (!pub.journal_ref.match(/\(\d{4}\)\s*$/)) {
          let publishedYear = "";
          if (pub.published) {
            const date = new Date(pub.published);
            publishedYear = date.getFullYear().toString();
          }
          if (publishedYear) {
            displayJournalRef = `${pub.journal_ref} (${publishedYear})`;
          }
        }
        journalLink = displayJournalRef;
      }
      let arxivLink = "";
      if (pub.id) {
        const arxivMatch = pub.id.match(/arxiv\.org\/abs\/(\d+\.\d+)/);
        if (arxivMatch) {
          const arxivCode = arxivMatch[1];
          const arxivUrl = pub.arxiv_url || pub.id;
          let arxivYear = "";
          if (pub.published) {
            const date = new Date(pub.published);
            arxivYear = date.getFullYear().toString();
          }
          arxivLink = `<a href="${arxivUrl}" style="color: inherit;">arXiv:${arxivCode} (${arxivYear})</a>`;
        }
      }
      let referencesLine = "";
      if (journalLink && arxivLink) {
        referencesLine = `${journalLink} | ${arxivLink}`;
      } else if (journalLink) {
        referencesLine = journalLink;
      } else if (arxivLink) {
        referencesLine = arxivLink;
      }
      let awardsLine = "";
      if (pub.awards && Array.isArray(pub.awards) && pub.awards.length > 0) {
        const awardLinks = pub.awards.map((award) => {
          if (award.type && award.url) {
            return `<a href="${award.url}" style="color: inherit;">${award.type}</a>`;
          } else if (award.type) {
            return award.type;
          }
          return null;
        }).filter((link) => link !== null);
        if (awardLinks.length > 0) {
          awardsLine = `<br><span style="font-size: 1.1em; font-style: italic;">Awards: ${awardLinks.join(", ")}</span>`;
        }
      }
      let coverageLine = "";
      if (pub.coverage && Array.isArray(pub.coverage) && pub.coverage.length > 0) {
        const coverageLinks = pub.coverage.map((coverage) => {
          if (coverage.source && coverage.url) {
            return `<a href="${coverage.url}" style="color: inherit;">${coverage.source}</a>`;
          } else if (coverage.source) {
            return coverage.source;
          }
          return null;
        }).filter((link) => link !== null);
        if (coverageLinks.length > 0) {
          coverageLine = `<br><span style="font-size: 1.1em; font-style: italic;">Featured in: ${coverageLinks.join(", ")}</span>`;
        }
      }
      let yearKey = extractPublicationYear(pub);
      let yearHeader = "";
      if (index === 0 || yearKey !== extractPublicationYear(publicationsList[index - 1])) {
        yearHeader = `
                <span style="font-size: 1.1em; font-weight: bold;">${yearKey}</span>
                <hr style="margin: 10px 0;">
            `;
      }
      return `
            ${yearHeader}
            <p>
                <span style="font-size: 1.2em;"><b><a href="${doiUrl}" style="color: inherit; text-decoration: none !important; border-bottom: none !important;">${pub.title}</a></b></span>
                <br>
                <span style="font-size: 1.1em;">${authorsFormatted}</span>
                <br>
                ${referencesLine}${awardsLine}${coverageLine}
            </p>
        `;
    }).join("");
    container.innerHTML = publicationsHtml;
    const publicationsWrapper = document.getElementById("publications-scroll-wrapper");
    if (publicationsWrapper) {
      publicationsWrapper.style.overflowY = "scroll";
    }
  }

  // src/js/publications/filters.js
  function filterPreprints() {
    const searchInput = document.getElementById("publications-search");
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
    let filtered = getAllPreprints();
    if (searchTerm !== "") {
      const searchTerms = searchTerm.split(/[,\s]+/).filter((term) => term.trim() !== "").map((term) => normalizeText(term));
      filtered = filtered.filter((pub) => {
        const searchableText = normalizeText(JSON.stringify(pub).toLowerCase());
        return searchTerms.every((term) => searchableText.includes(term));
      });
    }
    const selectedFilters = getSelectedFilters();
    if (selectedFilters.size > 0) {
      filtered = filtered.filter((pub) => {
        const authorsList = (pub.authors || "").toLowerCase();
        const normalizedAuthors = normalizeText(authorsList);
        const pubAuthorIds = Array.isArray(pub.author_ids) ? pub.author_ids : [];
        const canonicalNameToId = getCanonicalNameToId();
        return Array.from(selectedFilters).every((selectedAuthor) => {
          const normalizedAuthor = normalizeText(selectedAuthor.toLowerCase());
          if (normalizedAuthors.includes(normalizedAuthor)) return true;
          const authorId = canonicalNameToId[selectedAuthor];
          if (authorId && pubAuthorIds.includes(authorId)) return true;
          return false;
        });
      });
    }
    const yearRange = getYearRange();
    filtered = filtered.filter((pub) => {
      const year = extractPublicationYear(pub);
      if (!year) return true;
      const yearNum = parseInt(year);
      return yearNum >= yearRange.min && yearNum <= yearRange.max;
    });
    setFilteredPreprints(filtered);
    updateResultsCounter(filtered.length);
    displayPreprints();
    return filtered;
  }
  function filterPublications() {
    const searchInput = document.getElementById("publications-search");
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
    let filtered = getAllPublications();
    if (searchTerm !== "") {
      const searchTerms = searchTerm.split(/[,\s]+/).filter((term) => term.trim() !== "").map((term) => normalizeText(term));
      filtered = filtered.filter((pub) => {
        const searchableText = normalizeText(JSON.stringify(pub).toLowerCase());
        return searchTerms.every((term) => searchableText.includes(term));
      });
    }
    const selectedFilters = getSelectedFilters();
    if (selectedFilters.size > 0) {
      filtered = filtered.filter((pub) => {
        const authorsList = (pub.authors || "").toLowerCase();
        const normalizedAuthors = normalizeText(authorsList);
        const pubAuthorIds = Array.isArray(pub.author_ids) ? pub.author_ids : [];
        const canonicalNameToId = getCanonicalNameToId();
        return Array.from(selectedFilters).every((selectedAuthor) => {
          const normalizedAuthor = normalizeText(selectedAuthor.toLowerCase());
          if (normalizedAuthors.includes(normalizedAuthor)) return true;
          const authorId = canonicalNameToId[selectedAuthor];
          if (authorId && pubAuthorIds.includes(authorId)) return true;
          return false;
        });
      });
    }
    const yearRange = getYearRange();
    filtered = filtered.filter((pub) => {
      const year = extractPublicationYear(pub);
      if (!year) return true;
      const yearNum = parseInt(year);
      return yearNum >= yearRange.min && yearNum <= yearRange.max;
    });
    setFilteredPublications(filtered);
    updateResultsCounter(filtered.length);
    displayPublications();
    return filtered;
  }
  function updateFiltersForView() {
    const filterContainer = document.getElementById("publications-filters");
    const yearSliderContainer = document.getElementById("publications-year-slider");
    if (!filterContainer || !yearSliderContainer) return;
    filterContainer.innerHTML = "";
    yearSliderContainer.innerHTML = "";
    const selectedFilters = getSelectedFilters();
    const activeMembers = getActiveMembers();
    const currentView = getCurrentView();
    activeMembers.forEach((memberName) => {
      const button = document.createElement("span");
      button.className = "author-filter";
      button.textContent = formatAuthorAsInitials(memberName);
      button.dataset.author = memberName;
      if (selectedFilters.has(memberName)) {
        button.classList.add("active");
      }
      button.addEventListener("click", function() {
        if (this.classList.contains("active")) {
          this.classList.remove("active");
          removeFilter(memberName);
        } else {
          this.classList.add("active");
          addFilter(memberName);
        }
        if (currentView === "preprints") {
          filterPreprints();
        } else {
          filterPublications();
        }
      });
      filterContainer.appendChild(button);
    });
    createYearSlider(yearSliderContainer);
  }
  function createYearSlider(container) {
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    const minYear = getDynamicMinYear();
    const yearRange = getYearRange();
    const currentView = getCurrentView();
    container.innerHTML = `
        <div class="year-slider-container">
            <div class="year-range-inputs">
                <span class="year-slider-label">Year:</span>
                <input type="number" id="unified-year-min" class="year-input" min="${minYear}" max="${currentYear}" value="${yearRange.min}">
                <span class="year-separator">\u2013</span>
                <input type="number" id="unified-year-max" class="year-input" min="${minYear}" max="${currentYear}" value="${yearRange.max}">
            </div>
        </div>
    `;
    const minInput = document.getElementById("unified-year-min");
    const maxInput = document.getElementById("unified-year-max");
    minInput.addEventListener("change", function() {
      let minValue = parseInt(this.value);
      let maxValue = parseInt(maxInput.value);
      if (isNaN(minValue) || minValue < minYear) {
        minValue = minYear;
        this.value = minValue;
      }
      if (minValue > currentYear) {
        minValue = currentYear;
        this.value = minValue;
      }
      if (minValue > maxValue) {
        minValue = maxValue;
        this.value = minValue;
      }
      setMinYear(minValue);
      if (currentView === "preprints") {
        filterPreprints();
      } else {
        filterPublications();
      }
    });
    minInput.addEventListener("blur", function() {
      this.dispatchEvent(new Event("change"));
    });
    minInput.addEventListener("keydown", function(e) {
      if (e.key === "Enter") {
        this.blur();
      }
    });
    maxInput.addEventListener("change", function() {
      let minValue = parseInt(minInput.value);
      let maxValue = parseInt(this.value);
      if (isNaN(maxValue) || maxValue > currentYear) {
        maxValue = currentYear;
        this.value = maxValue;
      }
      if (maxValue < minYear) {
        maxValue = minYear;
        this.value = maxValue;
      }
      if (maxValue < minValue) {
        maxValue = minValue;
        this.value = maxValue;
      }
      setMaxYear(maxValue);
      if (currentView === "preprints") {
        filterPreprints();
      } else {
        filterPublications();
      }
    });
    maxInput.addEventListener("blur", function() {
      this.dispatchEvent(new Event("change"));
    });
    maxInput.addEventListener("keydown", function(e) {
      if (e.key === "Enter") {
        this.blur();
      }
    });
  }
  function switchView(view) {
    setCurrentView(view);
    const slider = document.querySelector(".toggle-slider");
    document.querySelectorAll(".toggle-button").forEach((btn) => {
      if (btn.dataset.view === view) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
    if (slider) {
      if (view === "preprints") {
        slider.classList.remove("publications");
      } else {
        slider.classList.add("publications");
      }
    }
    updateFiltersForView();
    if (view === "preprints") {
      filterPreprints();
    } else {
      filterPublications();
    }
  }

  // src/js/publications/export.js
  function pubToBibTeX(pub, isPreprint = false) {
    let entryType = "@article";
    if (isPreprint) {
      entryType = "@misc";
    } else if (pub.type && pub.type.toLowerCase() === "book") {
      entryType = "@book";
    }
    let citationKey = "";
    if (pub.doi) {
      citationKey = pub.doi.replace("10.", "").replace(/\//g, ".");
    } else if (pub.arxiv_id) {
      citationKey = pub.arxiv_id.replace(".", "");
    } else {
      const firstAuthor = pub.authors ? pub.authors.split(",")[0].trim().split(" ").pop() : "Unknown";
      const year2 = extractPublicationYear(pub) || (/* @__PURE__ */ new Date()).getFullYear();
      citationKey = `${firstAuthor}:${year2}`;
    }
    let bibtex = `${entryType}{${citationKey},
`;
    if (pub.title) {
      bibtex += `  title = {${toLatex(pub.title)}},
`;
    }
    if (pub.authors) {
      bibtex += `  author = {${toLatex(pub.authors)}},
`;
    }
    const year = extractPublicationYear(pub);
    if (year) {
      bibtex += `  year = ${year},
`;
    }
    if (pub.published) {
      const date = new Date(pub.published);
      const month = date.toLocaleString("en", { month: "short" }).toLowerCase();
      bibtex += `  month = ${month},
`;
    }
    if (isPreprint) {
      if (pub.arxiv_id) {
        bibtex += `  number = {arXiv:${pub.arxiv_id}},
`;
        bibtex += `  eprint = {${pub.arxiv_id}},
`;
        bibtex += `  primaryclass = {cond-mat},
`;
        bibtex += `  publisher = {arXiv},
`;
        bibtex += `  archiveprefix = {arXiv},
`;
      }
      if (pub.doi) {
        bibtex += `  doi = {${pub.doi}},
`;
      }
      if (pub.arxiv_url) {
        bibtex += `  url = {${pub.arxiv_url}},
`;
      }
    } else {
      if (pub.journal_ref) {
        const journalMatch = pub.journal_ref.match(/^(.+?)\s+\d+/);
        if (journalMatch) {
          bibtex += `  journal = {${toLatex(journalMatch[1].trim())}},
`;
        } else {
          const journalMatch2 = pub.journal_ref.match(/^([^,]+)/);
          if (journalMatch2) {
            bibtex += `  journal = {${toLatex(journalMatch2[1].trim())}},
`;
          }
        }
        const volumeMatch = pub.journal_ref.match(/\s+(\d+),/);
        if (volumeMatch) {
          bibtex += `  volume = {${volumeMatch[1]}},
`;
        }
        const numberMatch = pub.journal_ref.match(/,\s*(\d+)\s*\(/);
        if (numberMatch) {
          bibtex += `  number = {${numberMatch[1]}},
`;
        }
        const pagesMatch = pub.journal_ref.match(/,\s*(\d+)/);
        if (pagesMatch) {
          bibtex += `  pages = {${pagesMatch[1]}},
`;
        }
      }
      if (pub.publisher) {
        bibtex += `  publisher = {${toLatex(pub.publisher)}},
`;
      }
      if (pub.doi) {
        bibtex += `  doi = {${pub.doi}},
`;
      }
      if (pub.journal_url) {
        bibtex += `  url = {${pub.journal_url}},
`;
      }
      if (pub.type && pub.type.toLowerCase() === "book") {
        if (pub.edition) {
          bibtex += `  edition = {${pub.edition}},
`;
        }
        if (pub.isbn) {
          bibtex += `  isbn = {${pub.isbn}},
`;
        }
      }
    }
    if (pub.summary) {
      const cleanAbstract = pub.summary.replace(/\n/g, " ").replace(/\s+/g, " ");
      bibtex += `  abstract = {${toLatex(cleanAbstract)}},
`;
    }
    if (pub.published) {
      const date = new Date(pub.published);
      const urldate = date.toISOString().split("T")[0];
      bibtex += `  urldate = {${urldate}},
`;
    }
    if (pub.keywords) {
      if (Array.isArray(pub.keywords)) {
        bibtex += `  keywords = {${toLatex(pub.keywords.join(", "))}},
`;
      } else {
        bibtex += `  keywords = {${toLatex(pub.keywords)}},
`;
      }
    }
    if (pub.coverage && Array.isArray(pub.coverage) && pub.coverage.length > 0) {
      const coverageText = pub.coverage.map((c) => `${toLatex(c.source)}: ${c.url}`).join("; ");
      bibtex += `  note = {Featured in: ${coverageText}},
`;
    }
    if (pub.awards && Array.isArray(pub.awards) && pub.awards.length > 0) {
      const awardsText = pub.awards.map((a) => `${toLatex(a.type)}: ${a.url}`).join("; ");
      if (pub.coverage && pub.coverage.length > 0) {
        bibtex = bibtex.slice(0, -3) + `; Awards: ${awardsText}},
`;
      } else {
        bibtex += `  note = {Awards: ${awardsText}},
`;
      }
    }
    bibtex = bibtex.slice(0, -2) + "\n}\n";
    return bibtex;
  }
  function dataToBibTeX(data, isPreprint = false) {
    return data.map((pub) => pubToBibTeX(pub, isPreprint)).join("\n");
  }
  function downloadJSON(data, filename) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  function downloadBibTeX(data, filename, isPreprint = false) {
    const bibStr = dataToBibTeX(data, isPreprint);
    const blob = new Blob([bibStr], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  function setupDownloadButtons() {
    const downloadJson = document.getElementById("download-publications-json");
    const downloadBib = document.getElementById("download-publications-bib");
    if (downloadJson) {
      downloadJson.addEventListener("click", function() {
        const timestamp = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const currentView = getCurrentView();
        const data = currentView === "preprints" ? getFilteredPreprints() : getFilteredPublications();
        const filename = currentView === "preprints" ? `qudyma_preprints_${timestamp}.json` : `qudyma_publications_${timestamp}.json`;
        downloadJSON(data, filename);
      });
    }
    if (downloadBib) {
      downloadBib.addEventListener("click", function() {
        const timestamp = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const currentView = getCurrentView();
        const data = currentView === "preprints" ? getFilteredPreprints() : getFilteredPublications();
        const filename = currentView === "preprints" ? `qudyma_preprints_${timestamp}.bib` : `qudyma_publications_${timestamp}.bib`;
        const isPreprint = currentView === "preprints";
        downloadBibTeX(data, filename, isPreprint);
      });
    }
  }

  // src/js/publications/main.js
  async function init() {
    try {
      await loadAllData();
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get("view");
      const authorIdParam = params.get("authorId");
      const authorNameParam = params.get("authorName");
      let initialView = "preprints";
      if (viewParam === "published") {
        initialView = "publications";
      }
      let authorFilterSet = false;
      if (authorIdParam) {
        const canonicalNameToId = getCanonicalNameToId();
        let authorName = null;
        for (const [name, id] of Object.entries(canonicalNameToId)) {
          if (id === authorIdParam) {
            authorName = name;
            break;
          }
        }
        if (authorName) {
          clearFilters();
          addFilter(authorName);
          authorFilterSet = true;
        }
      } else if (authorNameParam) {
        clearFilters();
        setTimeout(() => {
          const searchInput2 = document.getElementById("publications-search");
          if (searchInput2) {
            searchInput2.value = authorNameParam;
            searchInput2.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }, 0);
      } else {
        clearFilters();
      }
      switchView(initialView);
      if (initialView === "preprints") {
        const filteredPreprints = filterPreprints();
        displayPreprints(filteredPreprints);
      } else {
        const filteredPublications = filterPublications();
        displayPublications(filteredPublications);
      }
      updateFiltersForView();
      const searchInput = document.getElementById("publications-search");
      if (searchInput) {
        searchInput.addEventListener("input", function() {
          const currentView = getCurrentView();
          if (currentView === "preprints") {
            const filtered = filterPreprints();
            displayPreprints(filtered);
          } else {
            const filtered = filterPublications();
            displayPublications(filtered);
          }
        });
      }
      document.querySelectorAll(".toggle-button").forEach((button) => {
        button.addEventListener("click", function() {
          const view = this.dataset.view;
          switchView(view);
          if (view === "preprints") {
            const filtered = filterPreprints();
            displayPreprints(filtered);
          } else {
            const filtered = filterPublications();
            displayPublications(filtered);
          }
        });
      });
      setupDownloadButtons();
      console.log("Publications page initialized successfully");
    } catch (error) {
      console.error("Error initializing publications page:", error);
      const container = document.getElementById("publications-container");
      if (container) {
        container.innerHTML = "<p>Error loading publications database. Please try again later.</p>";
      }
    }
  }
  document.addEventListener("DOMContentLoaded", init);
})();
