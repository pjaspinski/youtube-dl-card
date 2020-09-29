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
        if (!config.script) throw new Error('Please define a script that should be executed on download (script).');
        if (!config.sensor) throw new Error('Please define a sensor with returned information (sensor).');
        if (!config.remote_user) throw new Error('Please define an username for ssh access to remote machine (remote_user).');
        if (!config.remote_ip) throw new Error('Please define an ip address for ssh access to remote machine (remote_ip).');
        if (!config.lla_token) throw new Error('Please define a Long-Lived Access Token (lla_token).');
        this._config = config;
        this.command_before_url = "(" + this.getCurlPostCommand("Downloading...") + " ; ssh -i /config/.ssh/id_rsa -o 'StrictHostKeyChecking=no' " +
            this._config.remote_user + '@' + this._config.remote_ip + " '/usr/sbin/youtube-dl ";
        this.command_after_url = "' && " + this.getCurlPostCommand("Download complete!") + " || " + this.getCurlPostCommand("Error!") +
        " ; sleep 10 ; "+ this.getCurlPostCommand("") + ") &";
    }

    getCurlPostCommand(state){
        return "curl -X POST -H 'Authorization: Bearer " + this._config.lla_token + 
        "' -d '{ \\\"state\\\" : \\\"" + state + "\\\"}' http://localhost:8123/api/states/" + this._config.sensor;
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
        this._hass.callService("script","turn_on",{
            entity_id: this._config.script, variables: {command: this.command}
        });
    }
}

customElements.define('youtube-dl-card', YoutubeDlCard);