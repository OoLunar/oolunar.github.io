const SVG_FORK = `<svg class="emoji" aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-repo-forked mr-2">
                      <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"></path>
                  </svg>`;

const SVG_STAR = `<svg class="emoji" aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-star d-inline-block mr-2">
                      <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z"></path>
                  </svg>`;

const SVG_EXTERNAL_LINK = `<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-link-external">
                               <path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z"></path>
                           </svg>`;

const CACHE_KEY = "githubData";
const CACHE_EXPIRATION_TIME = 30 * 60 * 1000; // 30 minutes
const fetchCached = (url, requestInfo = {}) => {
	const cacheKey = `cache_${url}`;
	const cachedData = localStorage.getItem(cacheKey);
	if(cachedData) {
		const { timestamp, data } = JSON.parse(cachedData);
		if((Date.now() - timestamp) < CACHE_EXPIRATION_TIME) {
			if(typeof data === "string" && data.startsWith("HTTP error:")) {
				throw new Error(data);
			}

			return Promise.resolve(data);
		}
	}

	return fetch(url, requestInfo)
		.then(response => {
			if(!response.ok) {
				throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
			} else if(response.headers.has("content-type") && response.headers.get("content-type").startsWith("application/json")) {
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
		.catch(error => {
			// Store the response as an error
			localStorage.setItem(cacheKey, JSON.stringify({
				timestamp: Date.now(),
				data: error.message
			}));
		});
};

const cmp = (a, b) => {
	if(a > b) return +1;
	if(a < b) return -1;
	return 0;
};

const orgsList = document.getElementById("orgsList");
const docsList = document.getElementById("docsList");
const loading = document.getElementById("loading");
const readme = document.getElementById("readme");
const repoList = document.getElementById("repoList");

const createElement = (tagName, className, innerHTML) => {
	const element = document.createElement(tagName.toLowerCase());
	if(className) {
		element.setAttribute('class', className);
	}

	if(innerHTML) {
		element.innerHTML = innerHTML;
	}

	return element;
};

const createRepoTitle = (model) => {
	const titleElement = createElement('h4');

	if(model.separateOrgName) {
		titleElement.appendChild(createElement('span', 'repo-title-org', `${model.orgName}/`));
	}

	const repoNameSpan = createElement('span', null, model.repoName);
	titleElement.appendChild(repoNameSpan);
	return titleElement;
};

const createRepoStats = (model) => {
	const statsElement = createElement('div');

	statsElement.appendChild(createLogoImage(model));
	if(model.language.length > 0) {
		const languageSpan = createElement('span', null, model.language);
		const bullSpan1 = createElement('span', 'bull');
		statsElement.appendChild(languageSpan);
		statsElement.appendChild(bullSpan1);
	}

	const starsCount = createElement('span', null, Number.parseInt(model.stars).toLocaleString());
	const starsIcon = createElement('span', null, SVG_STAR);
	starsIcon.setAttribute('title', 'Stars');

	const bullSpan2 = createElement('span', 'bull');

	const forksCount = createElement('span', null, Number.parseInt(model.forks).toLocaleString());
	const forksIcon = createElement('span', null, SVG_FORK);
	forksIcon.setAttribute('title', 'Forks');

	statsElement.append(starsCount, starsIcon, bullSpan2, forksCount, forksIcon);
	return statsElement;
};

const createForkBadge = () => createElement('span', 'badge-fork', 'Fork');

const createDescription = (model) => createElement('p', null, model.description);

const createLogoImage = (model) => {
	const imgElement = createElement('img');
	imgElement.style.display = 'none';

	const storageKey = `logo_${model.fullName.replace('/', '_')}`;
	const cachedLogo = localStorage.getItem(storageKey);

	if(cachedLogo == null) {
		const logoSources = [
			`https://raw.githubusercontent.com/${model.fullName}/${model.defaultBranch}/res/logo.svg`,
			`https://raw.githubusercontent.com/${model.fullName}/${model.defaultBranch}/img/logo.svg`,
			`https://raw.githubusercontent.com/${model.fullName}/${model.defaultBranch}/res/logo.png`,
			`https://raw.githubusercontent.com/${model.fullName}/${model.defaultBranch}/img/logo.png`
		];

		const setNextImageSource = (img, index) => {
			if(index >= logoSources.length) {
				localStorage.setItem(storageKey, 'not_found');
				img.onerror = null;
				return;
			}

			const source = logoSources[index];
			img.onerror = () => setNextImageSource(img, index + 1);
			img.onload = () => {
				localStorage.setItem(storageKey, source);
				img.style.display = 'block';
			};
			img.src = source;
		};

		setNextImageSource(imgElement, 0);
	} else if(cachedLogo !== 'not_found') {
		imgElement.src = cachedLogo;
		imgElement.style.display = 'block';
	}

	return imgElement;
};

const createHomePageTab = (model) => {
	// Add a tab to the docsLink element, using the repository name, logo and homepage url
	const docsLink = createElement('div', 'org rounded');
	docsLink.dataset.githubId = model.fullName;

	const logo = createLogoImage(model);

	const title = createElement('h3', null, model.repoName);
	const link = createElement('span', null, SVG_EXTERNAL_LINK);

	docsLink.appendChild(logo);
	docsLink.appendChild(title);
	docsLink.appendChild(link);
	docsLink.addEventListener("click", () => {
		window.open(model.homepage, "_blank");
	});

	docsList.appendChild(docsLink);
};

const createRepo = (model) => {
	if(model.homepage != undefined && model.homepage != null && model.homepage != "" && !model.isFork) {
		createHomePageTab(model);
	}

	const repoElement = createElement('div', 'repo rounded');
	repoElement.dataset.githubId = model.fullName;

	repoElement.appendChild(createRepoTitle(model));
	repoElement.appendChild(createRepoStats(model));

	if(model.isFork === true) {
		repoElement.appendChild(createForkBadge());
	}

	repoElement.appendChild(createDescription(model));
	twemoji.parse(repoElement);
	return repoElement;
};

const setLoadingState = (isLoading) => {
	if(isLoading === true) {
		repoList.style.display = "none";
		readme.style.display = "none";
		loading.style.display = "block";
	} else {
		repoList.removeAttribute("style");
		loading.style.display = "none";
	}
};

const createOrgButton = (model) => {
	const container = document.createElement("div");
	container.setAttribute("class", "org rounded");
	container.dataset.githubId = model.name;

	const element1 = document.createElement("img");
	if(model.type === "org") {
		element1.setAttribute("class", "padding");
	}

	element1.setAttribute("src", model.avatar);
	element1.setAttribute("alt", model.name);
	container.appendChild(element1);

	const element2 = document.createElement("h3");
	element2.innerHTML = model.name;
	container.appendChild(element2);

	container.addEventListener("click", async () => {
		setLoadingState(true);
		try {
			await Promise.all([
				loadRepositories(model.name, model.type),
				loadReadme(model.readme)
			]);
		} catch(err) {
			console.error("Failed to load:", err);
		} finally {
			setLoadingState(false);
		}
	});

	return container;
};

const loadRepositories = (name, type) => {
	document.querySelectorAll(".org.active")?.forEach(e => e.classList.remove("active"));
	document.querySelector(`*[data-github-id='${name}']`)?.classList.add("active");
	name = name.replace(" ", "-");
	while(repoList.firstElementChild) {
		repoList.firstElementChild.remove();
	}

	while(docsList.firstElementChild) {
		docsList.firstElementChild.remove();
	}

	fetchCached(`https://api.github.com/${type}s/${name}/repos?sort=name&per_page=100`)
		.then(repos => repos.sort((a, b) => {
			if(a.stargazers_count !== b.stargazers_count) return cmp(b.stargazers_count, a.stargazers_count);
			if(a.fork !== b.fork) return cmp(a.fork, b.fork);
			if(a.forks_count !== b.forks_count) return cmp(b.forks_count, a.forks_count);
			return cmp(a.name, b.name);
		}).map(repo => {
			return {
				fullName: repo.full_name,
				orgName: repo.full_name.split("/")[0],
				repoName: repo.name,
				language: repo.language || "",
				stars: repo.stargazers_count,
				forks: repo.forks_count,
				description: repo.description,
				isFork: repo.fork,
				separateOrgName: type !== "user",
				defaultBranch: repo.default_branch,
				homepage: repo.homepage,
			};
		}).forEach(repo => {
			const el = createRepo(repo);
			repoList.appendChild(el);
		}));
};

const loadReadme = (repository) => {
	readme.style.display = "none";
	fetchCached(`https://api.github.com/repos/${repository}/readme`, {
		"headers": {
			"accept": "application/vnd.github.html"
		}
	}).then(response => {
		if(response) {
			readme.innerHTML = response || "";
			readme.removeAttribute("style");
		}
	});
};

let users = [];

const fetchUserData = () => {
	return fetchCached("https://api.github.com/users/OoLunar").then(response => {
		users[0] = {
			avatar: response.avatar_url,
			name: response.login,
			type: "user",
			readme: "OoLunar/OoLunar"
		};

		const orgButton = createOrgButton(users[0]);

		// Insert the user data as the first element in the orgsList
		if(orgsList.firstChild) {
			orgsList.insertBefore(orgButton, orgsList.firstChild);
		} else {
			orgsList.appendChild(orgButton);
		}
	});
};

const fetchOrgsData = () => {
	fetchCached("https://api.github.com/users/OoLunar/orgs").then(response => {
		response = response.sort((org1, org2) => org2.followers - org1.followers);
		let i = 0;
		for(const org of response) {
			const model = {
				avatar: org.avatar_url,
				name: org.login,
				type: "org",
				readme: `${org.login}/.github`,
			};

			users[i++] = model;
			orgsList.appendChild(createOrgButton(model));
		}
	});

	document.getElementById("orgsContainer").removeAttribute("style");
};

const load = () => {
	setLoadingState(true);
	fetchUserData().then(() => fetchOrgsData()).then(() => {
		if(document.location.search) {
			const goto = new URLSearchParams(document.location.search).get("goto");
			if(goto) {
				for(const user of users) {
					if(goto.localeCompare(user.name, undefined, { sensitivity: "base" }) === 0) {
						loadRepositories(user.name, user.type);
						loadReadme(user.readme);
						return;
					}
				}
			}
		}

		loadRepositories("OoLunar", "user");
		loadReadme("OoLunar/OoLunar");
	}).finally(() => setLoadingState(false));
};

load();