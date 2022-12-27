# Welcome to Gitter Hubson, the Watchman 🤖
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#)
[![Twitter: ikenfin](https://img.shields.io/twitter/follow/ikenfin.svg?style=social)](https://twitter.com/ikenfin)

> Get Telegram notifications on new issues/comments at Github

Simple google script code to notify github events with telegram bot.

## Installation

1. Create GoogleScript project at [https://script.google.com](https://script.google.com)
1. Place `.gs` files in that project
1. Fill config in `env.gs`
  1. Fill `APP_ACTION_VERIFY_TOKEN` with some strong random string
  1. Create bot in telegram using @botfather
      1. Fill bot token
      1. Fill chat id (see [https://stackoverflow.com/a/32572159](https://stackoverflow.com/a/32572159))
  1. Create Github api token
      1. Go to `Developer settings` then `Personal access tokens`
      1. Create new token with `admin:repo_hook` and `public_repo` permissions
      1. Copy/paste this token into `GITHUB_TOKEN` variable
      1. Fill `GITHUB_USER` with your github user
  1. Save `env.gs`
1. Publish google script as Web Application
1. Register bot webhooks using url `<google_script_url>?action=REGISTER&token=<ENV_TOKEN>`, you can also do this with telegram chat with `/register` command (*not tested!*)

## Author

👤 **ikenfin**

* Website: https://ikfi.ru
* Twitter: [@realtominoff](https://twitter.com/realtominoff)
* Github: [@ikenfin](https://github.com/ikenfin)

## Show your support

Give a ⭐️ if this project helped you!


***
_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_