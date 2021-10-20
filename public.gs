/**
 * Helper functions
 */
function isOkStatus(statusCode) {
  return [200, 201].includes(statusCode);
}

function checkActionToken(token) {
  return token === APP_ACTION_VERIFY_TOKEN;
}

function respond(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * After deploy you need to go to <DEPLOY_URL>?action=REGISTER&token=<ENV_TOKEN>
 */
function doGet(e) {
  const { action, token } = e.parameter;

  if (checkActionToken(token)) {
    switch (action) {
      case 'REGISTER': {
        return respond({
          github: registerWebhooks(),
          telegram: createTelegramHook(),
        });
      }
      case 'RESET': {
        return respond({
          github: deleteWebhooks(),
          telegram: deleteTelegramHook(),
        });
      }
      default:
        return respond({ error: 404, message: 'Not found' });
    }
  } else {
    return respond({
      error: 403,
      message: 'Not allowed',
    });
  }
}

/**
 * Webhooks handling endpoint
 */
function doPost(e) {
  const { source = null } = e.parameter;
  const webhookData = JSON.parse(e.postData.contents);

  if (source && source === 'telegram') {
    handleTelegramWebhook(webhookData);
  } else {
    handleGithubWebhook(webhookData);
  }
}
