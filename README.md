# youtube-dl-card
This custom card for HomeAssistant lets you download videos with youtube-dl to a remote machine with just one click (and one link paste).\
\
![](./preview.gif)
## How does it work?
This card utilizes Home Assistant's [Shell Command](https:/www.home-assistant.io/integrations/shell_command/) integration to execute a [youtube-dl](https://ytdl-org.github.io/youtube-dl/index.html) command on a remote machine using [SSH](https:/www.ssh.com/ssh/). Backwards communication is handled by posting information to Home Assistant's [REST API](https:/developers.home-assistant.io/docs/api/rest/) using [cURL](https:/curl.haxx.se/).

# Installation

# Credits