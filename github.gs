function checkGithubWebhookUrl(url) {
  return APP_CHECK_IDENTITY_REGEXP.test(url);
}

function generateGithubWebhookUrl() {
  return `${ScriptApp.getService().getUrl()}?${APP_SCRIPT_IDENTITY_PARAMS}&source=github`;
}

function makeGithubApiCall(apiMethod, parameters = {}, skipBody = false) {
  try {
    const response = UrlFetchApp.fetch(`${GITHUB_API_URL}/${apiMethod}`, {
      method: 'get',
      ...parameters,
      headers: {
        Authorization: `Token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    return {
      json: skipBody ? null : JSON.parse(response.getContentText()),
      status: response.getResponseCode(),
    };
  } catch (e) {
    // Logger.log(`apiMethod: ${apiMethod}, ${e.message}`)
    throw new Error(`apiMethod: ${apiMethod}, ${e.message}`);
  }
}

function makePagedGithubApiCall(apiMethod, parameters = {}) {
  let page = 1;
  let result = [];
  let finished = false;

  while (!finished) {
    try {
      const response = makeGithubApiCall(
        `${apiMethod}?page=${page}`,
        parameters,
        false
      );
      finished = response.json.length === 0;
      result = result.concat(response.json);
      page++;
    } catch (e) {
      // stop loop on errors
      finished = true;
    }
  }

  return { json: result };
}

// Api
function getUserOwnedRepositories(owner) {
  return makePagedGithubApiCall(`users/${owner}/repos`).json;
}

function getRepositoryWebhooks(repo, owner) {
  return makeGithubApiCall(`repos/${owner}/${repo}/hooks`).json;
}

function createWebhook(repo, owner) {
  const result = makeGithubApiCall(`repos/${owner}/${repo}/hooks`, {
    method: 'post',
    payload: JSON.stringify({
      name: 'web',
      active: true,
      events: ['issues', 'issue_comment'],
      config: {
        url: generateGithubWebhookUrl(),
        content_type: 'json',
      },
    }),
  });

  return isOkStatus(result.status);
}

function deleteWebhook(hook_id, repo, owner) {
  const result = makeGithubApiCall(
    `repos/${owner}/${repo}/hooks/${hook_id}`,
    {
      method: 'delete',
    },
    true
  );

  return result.status === 204;
}

function updateRepositoryHook(hook_id, repo, owner) {
  const result = makeGithubApiCall(
    `repos/${owner}/${repo}/hooks/${hook_id}/config`,
    {
      method: 'patch',
      payload: JSON.stringify({
        url: generateGithubWebhookUrl(),
      }),
    }
  );

  return isOkStatus(result.status);
}

function refreshRepositoryHooks(repo, owner) {
  const resultShape = {
    updated: 0,
    created: 0,
    updateError: 0,
    createError: 0,
  };

  const hooks = getRepositoryWebhooks(repo, owner);

  const updatableHooks = hooks.filter((hook) =>
    checkGithubWebhookUrl(hook.config.url)
  );

  if (updatableHooks.length > 0) {
    updatableHooks.forEach((hook) => {
      const { id } = hook;
      if (updateRepositoryHook(id, repo, owner)) {
        resultShape.updated++;
      } else {
        resultShape.updateError++;
      }
    });
  } else {
    if (createWebhook(repo, owner)) {
      resultShape.created++;
    } else {
      resultShape.createError++;
    }
  }

  return resultShape;
}

function deleteRepositoryHooks(repo, owner) {
  const resultShape = { deleted: 0, deleteError: 0 };

  const hooks = getRepositoryWebhooks(repo, owner);
  const deleteableHooks = hooks.filter((hook) =>
    checkGithubWebhookUrl(hook.config.url)
  );

  deleteableHooks.forEach((hook) => {
    const { id } = hook;
    if (deleteWebhook(id, repo, owner)) {
      resultShape.deleted++;
    } else {
      resultShape.deleteError++;
    }
  });

  return resultShape;
}

/*
  Register or update hook urls
*/
function registerWebhooks() {
  const repositories = getUserOwnedRepositories(GITHUB_USER);

  const resultShape = {
    created: 0,
    updated: 0,
    createError: 0,
    updateError: 0,
    total: repositories.length,
  };

  return repositories.reduce((prev, repo) => {
    const result = refreshRepositoryHooks(repo.name, GITHUB_USER);

    Object.keys(prev).forEach((key) => {
      prev[key] += result[key] || 0;
    });

    return prev;
  }, resultShape);
}

function deleteWebhooks() {
  const repositories = getUserOwnedRepositories(GITHUB_USER);

  const resultShape = {
    deleted: 0,
    deleteError: 0,
    total: repositories.length,
  };

  return repositories.reduce((prev, repo) => {
    const result = deleteRepositoryHooks(repo.name, GITHUB_USER);

    Object.keys(prev).forEach((key) => {
      prev[key] += result[key] || 0;
    });

    return prev;
  }, resultShape);
}

/**
 * Webhook handler
 */
function handleGithubWebhook(webhookData) {
  const { action = null } = webhookData;

  switch (action) {
    case 'opened': {
      const {
        issue: {
          html_url: url,
          title,
          user: { login },
        },
        repository: { name: repoName },
      } = webhookData;

      sendMessageToTelegram(
        `*🔥 ISSUE* at ${repoName}\n\n*Title: * ${title}\n*By: * ${login}\n[${url}](Open)`
      );
      break;
    }
    case 'created': {
      const {
        issue: { html_url: url, title },
        repository: { name: repoName },
        comment: {
          user: { login },
        },
      } = webhookData;

      sendMessageToTelegram(
        `*🤝 COMMENT* at ${repoName}\n\n*ISSUE: * ${title}\n*BY: * ${login}\n[${url}](open)`
      );
      break;
    }
  }
}
