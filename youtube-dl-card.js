import { LitElement, css, html } from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

class YoutubeDlCard extends LitElement  {

    static get properties() {
        return {
        hass: {},
        config: {},
        state: {},
        disableButton: {attribute: false}
        };
    }

    static get styles(){
        return css`
            #icon-container
            {
                color: var(--state-icon-color);
                float: right;
                margin-top: -6px;
            }   
            .card-content{
                margin-top: -25px;
            }         
            mwc-icon-button {
                --mdc-icon-button-size: 30px;
            }
            mwc-icon-button:active {
                color: var(--accent-color);
            }
            #info {
                font-size: var(--paper-input-container-shared-input-style_-_font-size);
                padding-left: 5px;
                padding-top: 5px;
                display: inline-block;
            }`;
    }

    render() {
        this.inputValue = ""
        return html`
        <ha-card>
            <div class="card-header">Youtube-DL
                <div id="icon-container">
                    <ha-icon icon="mdi:youtube"/>
                </div>
            </div>
            <div class="card-content">
                <paper-input @input="${this.onUrlChange}" label="Link to a video" value="${this.inputValue}"></paper-input>
                <mwc-icon-button @click="${this.onButtonClick}" ?disabled=${this.disableButton}>
                    <svg style="width:24px;height:24px" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
                    </svg>
                </mwc-icon-button>
                <label id="info">${this.state.returnedInfo}</label>  
            </div>
        </ha-card>
        `;
    }

    setConfig(config) {
        this._config = Object.assign([],config);
        if (!this._config.remote_ip) throw new Error('Please define an ip address for ssh access to remote machine (remote_ip).');
        if (!this._config.remote_user) throw new Error('Please define an username for ssh access to remote machine (remote_user).');
        if (!this._config.lla_token) throw new Error('Please define a Long-Lived Access Token (lla_token).');
        if (!this._config.sensor) this._config.sensor="sensor.youtube_dl_communication";
        if (!this._config.script) this._config.script="script.youtube_dl_script";
        if (!this._config.yt_dl_path) this._config.yt_dl_path="/usr/local/bin/youtube-dl";
        if (!this._config.ssh_key_path) this._config.ssh_key_path="/config/.ssh/id_rsa";
        if (!this._config.ha_port) this._config.ha_port="8123";
        if (!this._config.debug) this._config.debug=false;
        this.command_before_url = "(" + this.getCurlPostCommand("Downloading...") + " ; ssh -i "+this._config.ssh_key_path+" -o 'StrictHostKeyChecking=no' " +
            this._config.remote_user + '@' + this._config.remote_ip + " '"+this._config.yt_dl_path+" ";
        this.command_after_url = "' && " + this.getCurlPostCommand("Download complete!") + " || " + this.getCurlPostCommand("Error!") +
        " ; sleep 10 ; "+ this.getCurlPostCommand("") + ") &";
    }

    getCurlPostCommand(state){
        return "curl -X POST -H 'Authorization: Bearer " + this._config.lla_token + 
        "' -d '{ \\\"state\\\" : \\\"" + state + "\\\"}' http://localhost:"+this._config.ha_port+"/api/states/" + this._config.sensor;
    }

    set hass(hass) {
        this._hass = hass;
        this.state = {
            returnedInfo: this._hass.states[this._config.sensor].state
        }
        if(this.state.returnedInfo == "Download complete!" || this.state.returnedInfo == "Error!"){
            this.disableButton = false;
        }
        if(this.state.returnedInfo == "Download complete!") this.inputValue = "";
    }

    onUrlChange(e){
        this.url = e.path[0].value;
    }

    onButtonClick() {
        this.disableButton = true;
        this.command = this.command_before_url + this.url + this.command_after_url;
        if(this._config.debug) console.log("Youtube-DL card command output: \n"+this.command);
        this._hass.callService("script","turn_on",{
            entity_id: this._config.script, variables: {command: this.command}
        });
    }
}

customElements.define('youtube-dl-card', YoutubeDlCard);