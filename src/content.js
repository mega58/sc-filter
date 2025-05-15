if (!window.browser) {
  browser = chrome;
}

// https://stackoverflow.com/a/61511955
function waitForElement(selector) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  });
}

class FeedFilter {
  constructor(name, filterFileName) {
    this.name = name;
    this.filterFile = `/src/filters/${filterFileName}.js`;
  }
}

class FilterMenu {
  constructor(filters, activeFilterIndex) {
    this.activeFilterIndex = activeFilterIndex;
    this.filters = filters;
    this.root = document.createElement("div");
    this.root.id = "sc-filter-ext-menu";
    this.root.className = "stream__filter";

    for (const [i, filter] of filters.entries()) {
      const item = document.createElement("div");
      item.className = "streamFilter__item";
      const label = document.createElement("label");
      label.className = activeFilterIndex === i ? "g-tabs-link active" : "g-tabs-link";
      label.textContent = filter.name;

      label.addEventListener("click", () => {
        browser.storage.sync.set({ activeSCFeedFilterIndex: i }).then(() => {
          window.location.reload();
        });
      });

      item.appendChild(label);
      this.root.appendChild(item);
    }
  }
}

const FILTERS = [
  new FeedFilter("All", "all"),
  new FeedFilter("Tracks", "tracks"),
  new FeedFilter("Sets", "sets"),
];

function initFilters() {
  if (!document.getElementById("sc-filter-script-1")) {
    let script = document.createElement("script");
    script.id = "sc-filter-script-1";
    script.src = browser.runtime.getURL("/src/filter.js");
    document.documentElement.appendChild(script);
  }
  
  if (window.location.href.includes("soundcloud.com/feed")) {
    waitForElement(".stream__header").then((header) => {
      browser.storage.sync.get("activeSCFeedFilterIndex").then((item) => {
        const activeFilterIndex = item.activeSCFeedFilterIndex || 0;
        if (!document.getElementById("sc-filter-ext-menu")) {
          const filterMenu = new FilterMenu(FILTERS, activeFilterIndex);
          header.appendChild(filterMenu.root);
        }

        if (!document.getElementById("sc-filter-script-2")) {
          let script = document.createElement("script");
          script.id = "sc-filter-script-2";
          script.src = browser.runtime.getURL(
            FILTERS[activeFilterIndex].filterFile
          );
          document.documentElement.appendChild(script);
        }
      });
    });
  }
}

waitForElement("#content").then((content) => {
  const observer = new MutationObserver(initFilters);
  observer.observe(content, { childList: true });
});

initFilters();
