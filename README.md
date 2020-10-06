# youtube-dl-card
This custom card for HomeAssistant lets you download videos with youtube-dl to a remote machine with just one click (and one link paste).\
\
![](./preview.gif)
## How does it work?
This card utilizes Home Assistant's [Shell Command](https:/www.home-assistant.io/integrations/shell_command/) integration to execute a [youtube-dl](https://ytdl-org.github.io/youtube-dl/index.html) command on a remote machine using [SSH](https:/www.ssh.com/ssh/). Backwards communication is handled by posting information to Home Assistant's [REST API](https:/developers.home-assistant.io/docs/api/rest/) using [cURL](https:/curl.haxx.se/).

# Installation

This card requires several components to work properly. Here is an instruction on how to set it up:

1. [Remote machine](#remote-machine)  
2. [youtube-dl](#youtube-dl-configuration)  
3. [SSH configuration](#ssh)
4. [Script](#script)  
5. [Shell Command](#shell-command)  
6. [Communication Sensor](#communication-sensor)  
7. [Downloading card code](#downloading-card-code)  
8. [Card configuration](#card-configuration)

## <a name="remote-machine"></a>1. Remote machine
Your remote machine is the one that the card will download videos to. Most often it is a NAS. If you run Home Assistant in a container, you can use this card to download videos on a host system or a system in other container (just provide adequate ip address and/or port number in [card configuration](#card-configuration)).

## 2. youtube-dl configuration
Install [youtube-dl](https://ytdl-org.github.io/youtube-dl/index.html) on your remote machine. Since this card does not support passing arguments to youtube-dl command (for format selection etc.) they must be inserted in a config file.

If you use Linux and only plan on downloading videos from YouTube I recommend creating `/etc/youtube-dl.conf` file containing
```
-f bestvideo+bestaudio/best
-o path/%(title)s.%(ext)s
```
where `path` should be replaced with location that you want to download videos to.  

Please refer to [youtube-dl documentation](https://github.com/ytdl-org/youtube-dl/blob/master/README.md#configuration) for more information about configuration and config file locations on other operating systems.   

## 3. SSH configuration
This card requires passwordless access to the remote machine over SSH. You need access to the Home Assistant's terminal to set it up, so [SSH & Web Terminal](https://github.com/hassio-addons/addon-ssh) may come in handy.

First enter the following command into the HA terminal:
```
ssh-keygen
```
All options should be skipped by pressing enter.

After generating the key, it's time to add it to the remote machine. This can be done by executing the following command in the HA terminal:
```
ssh-copy-id username@ip
```
`username` must be replaced with one existing on the remote machine (you can create a new one for this sole purpose), `ip` must be replaced with the IP address of the remote machine.

Warning about the ECDSA key fingerprint can be dismissed by typing `yes`.

After executing this command you should be able to connect to the remote machine using:
```
ssh username@ip
```
You should not be prompted for password.

To allow this passwordless connection outside the terminal (in this case for commands executed by Shell Command) just copy the key to SSH config by typing:
```
cp ~/.ssh/id_rsa ~/config/.ssh/id_rsa
```

If you encounter any problems please refer to this [guide](https://siytek.com/home-assistant-shell/#Setup_SSH). It covers this configuration in much greater detail.

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
That is a sensor that receives information about download result (using [cURL](https:/curl.haxx.se/)).

Add following code to your `configuration.yaml` file:
```yaml
sensor:
  youtube_dl_communication:
    friendly_name: "youtube-dl-info"
    value_template: ""
```
## 7. Downloading card code
Download `youtube-dl-card.js` and place it somewhere in your `config/www/` folder.
Then navigate to Configuration > Lovelace Dashboards > Resources and add it there.
Path should be set to `/local/` + path of the file in `www` folder, type to `JavaScript Module`.

You should restart Home Assistant at this point

## <a name="card-configuration"></a>8. Card configuration
Adding this card to Lovelace requires providing some data. Paste the following code in text editor and fill it with data according to the table below.
```yaml
type: 'custom:youtube-dl-card'
script: 
sensor: 
remote_user: 
remote_ip: 
lla_token: >-

```  
| Name | Description | Default |
|------|-------------|---------|
|sensor| Name of the sensor created in point 4.|sensor.youtube_dl_communication|
|script| Name of the script created in point 5.|script.youtube_dl_script|
|remote_ip| IP address of the remote machine | -
|remote_user| Username of the account on the remote machine with passwordless access by SSH| -
|lla_token| Long-Lived Access Token, generated in Profile, used by cURL to authenticate |-

Since Long-Lived Access Tokens are quite long, they can be pasted after `>-` to become multiline arguments.

That completes the installation process, enjoy the card!

# Credits