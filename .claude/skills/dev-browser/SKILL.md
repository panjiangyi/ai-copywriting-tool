---
name:  dev browser
description: 一个可以让你控制浏览器的工具，支持使用 JavaScript 自动化脚本来操作浏览器。
metadata:
  type: reference
  project: ai-copywriting-tool
  version: 1.0
  status: active
---

james@james-pan:~/Documents/sidework/ai-copywriting-tool$ dev-browser
Control browsers with JavaScript automation scripts

Usage: dev-browser [OPTIONS] [COMMAND]

Commands:
  run            Run a script file against the browser
  install        Install Playwright browsers (Chromium)
  install-skill  Install the dev-browser skill into agent skill directories
  browsers       List all managed browser instances
  status         Show daemon status
  stop           Stop the daemon and all browsers
  help           Print this message or the help of the given subcommand(s)

Options:
      --browser <NAME>       Use a named daemon-managed browser instance [default: default]
      --connect [<URL>]      Connect to a running Chrome instance
      --headless             Launch daemon-managed Chromium without a visible window
      --ignore-https-errors  Ignore HTTPS certificate errors for daemon-managed Chromium
      --timeout <SECONDS>    Maximum script execution time in seconds [default: 30]
  -h, --help                 Print help (see more with '--help')

