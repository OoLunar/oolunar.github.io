const CACHE_KEY = "githubData";
const CACHE_EXPIRATION_TIME = 30 * 60 * 1000; // 30 minutes
const SVG_FORK = document.createElement("span");
SVG_FORK.innerHTML = `<svg class="emoji" aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-repo-forked mr-2">
                          <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"></path>
                      </svg>`;

const SVG_STAR = document.createElement("span");
SVG_STAR.innerHTML = `<svg class="emoji" aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-star d-inline-block mr-2">
                          <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z"></path>
                      </svg>`;

const SVG_EXTERNAL_LINK = document.createElement("span");
SVG_EXTERNAL_LINK.innerHTML = `<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-link-external">
                                   <path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z"></path>
                               </svg>`;

const projectDisplayContainer = document.getElementById("project-display");
const forkedReposContainer = document.getElementById("forked-display");

function cacheFetch(url, requestInfo = {}) {
    const cacheKey = `cache_${url}`;
    const cachedData = localStorage.getItem(cacheKey);
    if(cachedData) {
        const { timestamp, data } = JSON.parse(cachedData);
        if((Date.now() - timestamp) < CACHE_EXPIRATION_TIME) {
            return Promise.resolve(data);
        }
    }

    return fetch(url, requestInfo)
        .then(response => {
            if(response.headers.has("content-type") && response.headers.get("content-type").startsWith("application/json")) {
                return response.json();
            } else {
                return response.text();
            }
        })
        .then(data => {
            localStorage.setItem(cacheKey, JSON.stringify({
                timestamp: Date.now(),
                data: data
            }));
            return data;
        })
        .catch(error => console.error("Error fetching data:", error));
}

function generateTabsHTML(user, orgs, container) {
    const userTab = document.createElement("div");
    userTab.classList.add("tab");
    userTab.classList.add("active");
    userTab.textContent = user.login;

    const userImage = document.createElement("img");
    userImage.src = user.avatar_url;
    userImage.alt = `${user.login}'s avatar`;
    userImage.onerror = () => {
        userImage.onerror = null;
        userImage.src = "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/2754.svg";
    };

    userTab.appendChild(userImage);
    userTab.addEventListener("click", () => {
        for(const tab of container.children) {
            tab.classList.remove("active");
        }

        userTab.classList.add("active");
        return fetchData(user.login);
    });

    container.appendChild(userTab);

    for(const org of orgs) {
        const orgTab = document.createElement("div");
        orgTab.classList.add("tab");
        orgTab.textContent = org.login;

        const orgImage = document.createElement("img");
        orgImage.src = org.avatar_url;
        orgImage.alt = `${org.login}'s logo`;
        orgImage.onerror = () => {
            orgImage.onerror = null;
            orgImage.src = "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/2754.svg";
        };

        orgTab.appendChild(orgImage);
        orgTab.addEventListener("click", () => {
            for(const tab of container.children) {
                tab.classList.remove("active");
            }

            orgTab.classList.add("active");
            return fetchData(org.login);
        });
        container.appendChild(orgTab);
    }
}

function generateProjectHTML(data, container) {
    const readmeDiv = document.getElementById("description");
    readmeDiv.innerHTML = "";
    readmeDiv.style.display = "none";

    const homepagesDiv = document.getElementById("homepages");
    homepagesDiv.innerHTML = "";

    for(const item of data) {
        if((item.owner.type == "User" && item.name.toLowerCase() == item.owner.login.toLowerCase()) || (item.owner.type == "Organization" && item.name == ".github")) {
            const readmeEndpoint = `https://api.github.com/repos/${item.full_name}/readme`;
            cacheFetch(readmeEndpoint, {
                "headers": {
                    "accept": "application/vnd.github.html"
                }
            }).then(readme => {
                readmeDiv.innerHTML = readme;
                readmeDiv.style.display = "block";
            }).catch(error => console.error("Error fetching readme data:", error));

            continue;
        }

        const projectDiv = document.createElement("div");
        projectDiv.title = item.name;
        projectDiv.classList.add("w3-theme-l1");
        projectDiv.classList.add("project-display");
        projectDiv.addEventListener("click", () => window.open(item.html_url));

        const projectTitle = document.createElement("h4");
        projectTitle.textContent = item.name;

        const projectDescription = document.createElement("h5");
        projectDescription.textContent = item.description;

        const projectImage = document.createElement("img");
        projectImage.title = item.name;
        projectImage.style.backgroundColor = "transparent";

        const logoSources = [
            `https://raw.githubusercontent.com/${item.full_name}/${item.default_branch}/res/logo.svg`,
            `https://raw.githubusercontent.com/${item.full_name}/${item.default_branch}/img/logo.svg`,
            `https://raw.githubusercontent.com/${item.full_name}/${item.default_branch}/res/logo.png`,
            `https://raw.githubusercontent.com/${item.full_name}/${item.default_branch}/img/logo.png`,
            "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/2754.svg"
        ];

        const setNextImageSource = (div, index) => {
            if(index >= logoSources.length) {
                div.onerror = null;
                div.src = ""; // Set an empty source if all sources fail
                div.title = "No Logo Available";
                div.alt = "No Logo Available";
                div.classList.add("missing-img");
                return;
            }

            const source = logoSources[index];
            div.src = source;
            div.onerror = () => setNextImageSource(div, index + 1);
        };

        setNextImageSource(projectImage, 0);

        const projectMetadata = document.createElement("div");
        projectMetadata.classList.add("project-metadata");

        const projectLanguage = document.createElement("div");
        const projectLanguageText = document.createElement("span");
        projectLanguageText.textContent = item.language ?? "Unknown";
        projectLanguage.appendChild(projectLanguageText);

        const projectForks = document.createElement("div");
        const projectForksText = document.createElement("span");
        projectForksText.textContent = item.forks_count.toLocaleString();
        projectForks.appendChild(projectForksText);
        projectForks.appendChild(SVG_FORK.firstChild.cloneNode(true));

        const projectStars = document.createElement("div");
        const projectStarsText = document.createElement("span");
        projectStarsText.textContent = item.stargazers_count.toLocaleString();
        projectStars.appendChild(projectStarsText);
        projectStars.appendChild(SVG_STAR.firstChild.cloneNode(true));

        const projectStats = document.createElement("div");
        projectStats.classList.add("project-stats");
        projectStats.appendChild(projectForks);
        projectStats.appendChild(projectStars);

        projectMetadata.appendChild(projectLanguage);
        projectMetadata.appendChild(projectStats);

        projectDiv.appendChild(projectTitle);
        projectDiv.appendChild(projectMetadata);
        projectDiv.appendChild(projectDescription);
        projectDiv.appendChild(projectImage);

        if(item.homepage != undefined && item.homepage != null && item.homepage != "") {
            const homepageDiv = document.createElement("div");
            homepageDiv.classList.add("homepage");
            homepageDiv.classList.add("w3-theme-l1");
            homepageDiv.title = item.name;
            homepageDiv.addEventListener("click", () => window.open(item.homepage));

            const homepageImage = document.createElement("img");
            homepageImage.src = projectImage.src;
            homepageImage.alt = `${item.name}'s logo`;
            setNextImageSource(homepageImage, 0);

            const homepageTitle = document.createElement("h4");
            homepageTitle.textContent = item.name + " Docs";

            homepageDiv.appendChild(homepageImage);
            homepageDiv.appendChild(homepageTitle);
            homepageDiv.appendChild(SVG_EXTERNAL_LINK.firstChild.cloneNode(true));

            homepagesDiv.appendChild(homepageDiv);
        }

        twemoji.parse(projectDiv);
        container.appendChild(projectDiv);
    }
}

function fetchTabsData(username) {
    const container = document.getElementById("tabs");

    return cacheFetch(`https://api.github.com/users/${username}`)
        .then(user => {
            cacheFetch(`https://api.github.com/users/${username}/orgs`)
                .then(orgs => generateTabsHTML(user, orgs.sort((org1, org2) => org2.followers - org1.followers), container))
                .catch(error => console.error("Error fetching orgs data:", error));
        })
        .catch(error => console.error("Error fetching user data:", error));
}

function fetchData(username) {
    projectDisplayContainer.innerHTML = "";

    return cacheFetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`)
        .then(data => generateProjectHTML(data.filter(repo => !repo.fork && repo.name != `${username.toLowerCase()}.github.io`).sort((repo1, repo2) => {
            if(repo1.stargazers_count !== repo2.stargazers_count) {
                return repo2.stargazers_count - repo1.stargazers_count;
            } else if(repo1.forks_count !== repo2.forks_count) {
                return repo2.forks_count - repo1.forks_count;
            } else if(repo1.pushed_at !== repo2.pushed_at) {
                return new Date(repo2.pushed_at) - new Date(repo1.pushed_at);
            } else {
                return repo1.name.localeCompare(repo2.name);
            }
        }), projectDisplayContainer))
        .catch(error => console.error("Error fetching data:", error));
}

fetchTabsData("OoLunar").then(() => fetchData("OoLunar")).then(() => {
    twemoji.parse(document);
    document.getElementsByClassName("main-container")[0].style.visibility = "visible";
}).catch(error => console.error("Error fetching data:", error));