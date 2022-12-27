function generateTelegramWebhookUrl() {
  return `${ScriptApp.getService().getUrl()}?${APP_SCRIPT_IDENTITY_PARAMS}&source=telegram`;
}

function createTelegramHook() {
  const result = UrlFetchApp.fetch(
    `${TELEGRAM_API_URL}${TELEGRAM_TOKEN}/setWebhook?url=${encodeURIComponent(
      generateTelegramWebhookUrl()
    )}`,
    {
      method: 'get',
    }
  );

  return isOkStatus(result.getResponseCode());
}

function deleteTelegramHook() {
  const result = UrlFetchApp.fetch(
    `${TELEGRAM_API_URL}${TELEGRAM_TOKEN}/deleteWebhook`,
    {
      method: 'get',
    }
  );

  return isOkStatus(result.getResponseCode());
}

function getTelegramHook() {
  const response = UrlFetchApp.fetch(
    `${TELEGRAM_API_URL}${TELEGRAM_TOKEN}/getWebhookInfo`,
    { method: 'get' }
  );
  const { ok, result } = JSON.parse(response.getContentText());

  return ok && result.url;
}

function sendMessageToTelegram(text = 'No content') {
  UrlFetchApp.fetch(`${TELEGRAM_API_URL}${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'post',
    payload: {
      chat_id: TELEGRAM_CHAT_ID,
      parse_mode: 'Markdown',
      text,
    },
  });
}

function sendTypingToTelegram() {
  UrlFetchApp.fetch(
    `${TELEGRAM_API_URL}${TELEGRAM_TOKEN}/sendChatAction?chat_id=${TELEGRAM_CHAT_ID}&action=typing`
  );
}

/**
 * Command interface
 */
function handleTelegramWebhook(webhookData) {
  const { message = null } = webhookData;

  if (!message || TELEGRAM_CHAT_ID.localeCompare(message.chat.id) !== 0) {
    return;
  }

  switch (message.text) {
    case '/register': {
      sendMessageToTelegram(`*Ok!* Please wait...`);
      sendTypingToTelegram();

      const { created, updated, createError, updateError, total } =
        registerWebhooks();

      sendMessageToTelegram(
        [
          `*Done!* 🥳\n\n*Created:* ${created} (🔥 ${createError})`,
          '',
          `*Updated:* ${updated} (🔥 ${updateError})`,
          `*Total:* ${total}`,
        ].join('\n')
      );

      break;
    }
    case '/reset': {
      sendMessageToTelegram(`*Ok!* Please wait...`);
      sendTypingToTelegram();

      const { deleted, deleteError, total } = deleteWebhooks();

      sendMessageToTelegram(
        [
          `*Done!* 🥳`,
          '',
          `*Deleted:* ${deleted} (🔥 ${deleteError})`,
          `*Total:* ${total}`,
        ].join('\n')
      );

      break;
    }
    default:
      return sendMessageToTelegram(`Command not found 🥵`);
  }
}
