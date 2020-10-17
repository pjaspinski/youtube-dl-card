# youtube-dl-card
This custom card for HomeAssistant lets you download videos with youtube-dl to a remote machine with just one click (and one link paste).\
\
![](./preview.gif)
## How does it work?
This card utilizes Home Assistant's [Shell Command](https://home-assistant.io/integrations/shell_command) integration to execute a [youtube-dl](https://ytdl-org.github.io/youtube-dl/index.html) command on a remote machine using [SSH](https://ssh.com/ssh). Backwards communication is handled by posting information to Home Assistant's [REST API](https://developers.home-assistant.io/docs/api/rest) using [cURL](https://curl.haxx.se).

# Installation

This card requires several components to work properly. Here is an instruction on how to set it up:

1. [Remote machine](#1-remote-machine)  
2. [youtube-dl](#2-youtube-dl-configuration)  
3. [SSH configuration](#3-ssh-configuration)
4. [Shell Command](#4-shell-command) 
5. [Script](#5-script)  
6. [Communication Sensor](#6-communication-sensor)  
7. [Downloading card code](#7-downloading-card-code)  
8. [Card configuration](#8-card-configuration)
9. [Troubleshooting](#9-troubleshooting)

## 1. Remote machine
Your remote machine is the one that the card will download videos to. Most often it is a NAS. If you run Home Assistant in a container, you can use this card to download videos on a host system or a system in other container (just provide adequate ip address and/or port number in [card configuration](#8-card-configuration)).

## 2. youtube-dl configuration
Install [youtube-dl](https://ytdl-org.github.io/youtube-dl/index.html) on your remote machine. Since this card does not support passing arguments to youtube-dl command (for format selection etc.) they must be inserted in a config file.

If you use Linux and want the best quality video and audio I recommend creating `/etc/youtube-dl.conf` file containing
```
-f bestvideo+bestaudio/best
-o path/%(title)s.%(ext)s
```
where `path` should be replaced with location that you want to download videos to. Installing [FFmpeg](https://ffmpeg.org) is required with this settings, it handles merging video and audio files if they are separated (like in most YouTube videos).

If the path of your youtube-dl executable is different than `/usr/local/bin/youtube-dl` it must be added in [card configuration](#8-card-configuration). You can check this path by typing
```bash
which youtube-dl
```
in your remote machine's terminal.

Please refer to [youtube-dl documentation](https://github.com/ytdl-org/youtube-dl/blob/master/README.md#configuration) for more information about configuration and config file locations on other operating systems.   

## 3. SSH configuration
This card requires passwordless access to the remote machine over SSH. You need access to the Home Assistant's terminal to set it up, so [Terminal & SSH](https://github.com/home-assistant/hassio-addons/tree/master/ssh) may come in handy.

First enter the following command into the HA terminal:
```bash
ssh-keygen
```
All options should be skipped by pressing enter.

After generating the key, it's time to add it to the remote machine. This can be done by executing the following command in the HA terminal:
```bash
ssh-copy-id username@ip
```
`username` must be replaced with one existing on the remote machine (you can create a new one for this sole purpose), `ip` must be replaced with the IP address of the remote machine.

Warning about the ECDSA key fingerprint can be dismissed by typing `yes`.

After executing this command you should be able to connect to the remote machine using:
```bash
ssh username@ip
```
You should not be prompted for password.

To allow this passwordless connection outside the terminal (in this case for commands executed by Shell Command) just copy the key to SSH config by typing:
```bash
cp ~/.ssh/id_rsa ~/config/.ssh/id_rsa
```

If you encounter any problems please refer to this [guide](https://siytek.com/home-assistant-shell/#Setup_SSH). It covers this configuration in much greater detail (key's paths slightly differ between this instruction and the linked guide, you can provide your chosen path in [card configuration](#8-card-configuration)).

## 4. Shell Command
Adding a shell command allows executing it by calling it as a service from a script.

Add following code to your `configuration.yaml` file:
```yaml
shell_command:
  youtube_dl: /bin/bash -c "{{ command }}"
```

## 5. Script
Well, it calls that shell command from above.

Add following code to your `configuration.yaml` file:
```yaml
script:
  youtube_dl_script:
    sequence:
        - service: shell_command.youtube_dl
          data_template:
            command: "{{ command }}"
```

## 6. Communication Sensor
That is a sensor that receives information about download result (using [cURL](https://curl.haxx.se)).

Add following code to your `configuration.yaml` file:
```yaml
sensor:
  - platform: template
    sensors:
      youtube_dl_communication:
        friendly_name: "youtube-dl-info"
        value_template: ""
```
## 7. Downloading card code
Download `youtube-dl-card.js` and place it somewhere in your `config/www/` folder.
Then navigate to Configuration > Lovelace Dashboards > Resources and add it there.
Path should be set to `/local/` + path of the file in `www` folder, type to `JavaScript Module`.

You should restart Home Assistant at this point

## 8. Card configuration
Adding this card to Lovelace requires providing some data. Paste the following code in text editor and fill it with data according to the table below. You can edit default values by adding their keys to this configuration.
```yaml
type: 'custom:youtube-dl-card'
remote_user: 
remote_ip: 
lla_token: >-

```  

| Name | Description | Default |
|------|-------------|---------|
|remote_ip| IP address of the remote machine | -
|remote_user| Username of the account on the remote machine with passwordless access by SSH| -
|lla_token| Long-Lived Access Token, generated in Profile menu, used by cURL to authenticate ([learn more](https://developers.home-assistant.io/docs/auth_api/#long-lived-access-token)) |-
|sensor| Name of the sensor created in [section 4](#5-script)|sensor.youtube_dl_communication|
|script| Name of the script created in [section 5](#4-shell-command)|script.youtube_dl_script|
|yt_dl_path| Location of youtube-dl executable |/usr/local/bin/youtube-dl|
|ssh_key_path| Location of SSH key ([section 3](#3-ssh-configuration))|/config/.ssh/id_rsa|
|ha_port| Port that your Home Assistant is available on |8123|
|debug| Change to `true` to log executed commands to console (more in [section 9](#9-troubleshooting))| false |

Since Long-Lived Access Tokens are quite long, they can be pasted below `>-` to become multiline arguments.

That completes the installation process, enjoy the card!

## 9. Troubleshooting

If you find yourself in a situation where you think that you set everything up correctly, but you get a `Error!` message after pressing a download button, enable `debug` in [card configuration](#8-card-configuration). It logs every command to the console before executing it. You can than copy that command and execute it in Home Assistant's terminal, where you will be able to see it's output and hopefully see what is wrong.

# Credits

Big thanks to [michal7778](https://github.com/michal7778) and [wojtek14a](https://github.com/wojtek14a) - they got me interested in Home Assistant and helped with getting a basic idea of how such a card can be created.

Shoutout to Siytek for creating this amazing guide called '[Home Assistant shell integration: Local & SSH Linux control](https://siytek.com/home-assistant-shell)' - it was really helpful in the process of creating this card.

Thank you - Home Assistant's community and creators of all software used in this project. It would not be possible without you!