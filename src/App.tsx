import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import drone2 from '../assets/drone2.png';
import drone from '../assets/drone.png';
import bitcoin from '../assets/Bitcoin.png';
import on from '../assets/on.png';
import off from '../assets/off.png';
import fileUpload from '../assets/file.png';
import deleteFile from '../assets/delete.png';

import './App.global.css';
const tmi = require('tmi.js');
const dateFormat = require("dateformat");

const fs = require('fs');

const twitchRegex = /(((twitch.tv)|(www\.))[^\s]+)/g;
const urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;

class CommandConfig extends React.Component<{}, any> {
  client: any;

  constructor(props: any) {
    super(props);

    if (!localStorage.getItem('userInfo')) {
      localStorage.setItem('userInfo', '{"username": "","password": "","channels": "","command": "!doedoe","command2": "","command3": "", "command4": "", "command5": "", "filePath1": "","filePath2": "","filePath3": "","filePath4": "","filePath5": "","filePath6": "","filePath7": "","filePath8": "","filePath9": "","filePath10": "","message": "the doedoe is $1","message2": "","message3": "", "message4": "", "maskLink": {}}');
    }

    this.state = JSON.parse(localStorage.getItem('userInfo')!);

    if (!this.state.maskLink) {
      this.state.maskLink = {};
    }

    this.state.connected = false;
    this.state.logs = [];
    console.log('state init', this.state);
    this.client = null;
  }

  connectTwitch() {
    if (this.client) {
      return;
    }
    
    if (!this.state.username) {
      alert('invalid username. plz fix ur sh*t');
      return;
    }
    
    if (!this.state.password) {
      alert('invalid password. plz fix ur sh*t');
      return;
    }
    
    if (!this.state.command) {
      alert('invalid command. plz fix ur sh*t');
      return;
    }

    if (!this.state.message) {
      alert('invalid message. plz fix ur sh*t');
      return;
    }

    for (let i = 1; i < 11; i++) {
      const passedValidation = this._validateFilePath(i);
      if (!passedValidation) return;
    }
    
    localStorage.setItem('userInfo', JSON.stringify(this.state));
    const channels = this.state.channels.toLocaleLowerCase().replaceAll(' ','').split(',');
    if (channels.length < 1) {
      alert('invalid channel list. plz fix ur sh*t');
      return;
    }

    this.client = new tmi.Client({
      options: { debug: true },
      connection: {
        secure: true,
        reconnect: true
      },
      identity: {
        username: this.state.username,
        password: this.state.password
      },
      channels,
      logger: {
        info: (message: any) => {
          if (localStorage.getItem('debug')) {
            console.log('info', message);
          }
        },
        warn: (message: any) => {console.log('warn', message)},
        error: (message: any) => {console.log('error', message)}
      }
    });
    
    this.client.connect()
      .then(() => {
        this.setState({connected: true, channelsList: channels});
        
        this.client.on('message', (channel: string, tags: any, message: string, _self: boolean) => {
          if (message == this.state.command) {
            this.respondToCommand(tags.username, channel, message, '');
          } else if ((!!this.state.command2 && !!this.state.message2) && message == this.state.command2) {
            this.respondToCommand(tags.username, channel, message, '2');
          } else if ((!!this.state.command3 && !!this.state.message3) && message == this.state.command3) {
            this.respondToCommand(tags.username, channel, message, '3');
          } else if ((!!this.state.command4 && !!this.state.message4) && message == this.state.command4) {
            this.respondToCommand(tags.username, channel, message, '4');
          } else if ((!!this.state.command5 && !!this.state.message5) && message == this.state.command5) {
            this.respondToCommand(tags.username, channel, message, '5');
          }
          return;
        });
      }).catch((err: Error) => {
        this.setState({connected: false});
        console.error('error', err);
        alert('rippp -- could not connect to twitch.');
        this.client = null;
      });
  }

  respondToCommand(username: string, channel: string, message: string, commandNumber: string) {
    const log = `@${username} wrote ${message} from ${channel.replace('#', '')} at ${dateFormat(new Date(), 'dddd, mmmm dS, yyyy, h:MM:ss TT')}`;
    const logs = this.state.logs;
    logs.push(log);
    this.setState({logs})
    if (logs.length > 10) logs.shift();
    if (localStorage.getItem('debug')) console.log(log);
    const botMessage = this.createBotMessage(commandNumber, channel.replace('#', ''));
    this.client.say(channel, botMessage);
  }

  createBotMessage(messageNumber: string, channel: string) {
    var message = this.state[`message${messageNumber}`];
    if (!message) {
      return '';
    }

    for (let i = 1; i < 11; i++) {
      message = this._replaceFilePathContent(message, i);
    }

    return this.maskLinks(channel, message);
  }

  maskLinks(channel: string, message: string) {
    if (!this.state.maskLink[channel]) {
      return message;
    }
    return message.replace(twitchRegex, '***').replace(urlRegex, '***');;
  }

  disconnectTwitch() {
    this.setState({connected: false});
    if (!this.client) {
      return;
    }
    this.client.disconnect();
    this.client = null;
  }

  setPath(e: any, variable: string) {
    if (e && e.target && e.target.files && e.target.files[0] && e.target.files[0].path) {
      const newPath: any = {};
      const pathVar = `filePath${variable}`;
      newPath[pathVar] = e.target.files[0].path;
      this.setState(newPath);
    }
  }

  fileName(path: string) {
    if (!path) {
      return this.state.connected ? '(none)' : 'please select a file ';
    }
    const pathList = path.split('\\');
    return pathList[pathList.length-1] + ' ';
  }

  renderLogs(logs: string[]) {
    let renderLogs = [];
    for (let i = 0; i < logs.length; i++) {
      const keyId = `logs-${i}`;
      renderLogs.push(<div key={keyId}>{logs[i]}</div>);
    }
    return (
      <div style={{height: '198px'}}>
        {renderLogs}
      </div>
    )
  }

  toggleMaskLink(channel: string) {
    if (this.state.maskLink[channel]) {
      const update: any = {maskLink: {}};
      update.maskLink[channel] = !this.state.maskLink[channel];
      this.setState(update);
      return;
    }
    const update: any = {maskLink: {}};
    update.maskLink[channel] = true;
    this.setState(update);
  }

  renderChannelList(channels: string[]) {
    let renderChannels = [];
    for (let i = 0; i < channels.length; i++) {
      const keyId = `channel-${i}`;
      const channel = channels[i].replace('#', '');
      const startingValue = this.state.maskLink[channel];
      renderChannels.push(<span key={keyId}>{channel} <input type="checkbox" defaultChecked={startingValue} onChange={() => {this.toggleMaskLink(channel)}} /> | </span>)
    }
    return (
      <div>
        <span>check the channel to remove links from the message: </span><br />
        {renderChannels}
      </div>
    )
  }

  renderCommands() {
    let renderCommands = [];
    for (let i = 1; i < 6; i++) {
      let commandNumber = i == 1 ? '' : i;
      const keyId = `command-${i}`;
      if (this.state[`command${commandNumber}`] && this.state[`message${commandNumber}`]) {
        renderCommands.push(<span key={keyId}><strong>{this.state[`command${commandNumber}`]}</strong>: {this.state[`message${commandNumber}`]} <br/><br/></span>);
      }
    }
    return (
      <div>
        {renderCommands}
      </div>
    )
  }

  readOnly() {
    return (
      <div>
        <div style={{height: '376px', width: '890px', overflowY: 'auto'}}>
          <div>
            {this.renderChannelList(this.state.channelsList)} <br/><br/>
            {this.renderCommands()}
            <strong>Logs of people using the commands</strong>
            {this.renderLogs(this.state.logs)}
          </div>
        </div>
      </div>
    )
  }

  render() {
    let connectionStatus;
    if (this.state.connected) {
      connectionStatus = <span><img width="50px" alt="icon" src={on} style={{cursor:'pointer'}} onClick={() => {this.disconnectTwitch()}}/><span style={{display: 'inline-block'}}><strong>you are connected.</strong></span></span>
    } else {
      connectionStatus = <span><img width="50px" alt="icon" src={off} style={{cursor:'pointer'}} onClick={() => {this.connectTwitch()}}/><span style={{display: 'inline-block'}}><strong>you are not connected.</strong></span></span>
    }

    let body;
    if (this.state.connected) {
      body = this.readOnly();
    } else {
      body = this.editableConfig();
    }

    return (
      <div>
        <div style={{position: 'relative', left: '40%', width: '50%'}}>
          <img width="70px" alt="icon" src={drone2} />
          <img width="70px" alt="icon" src={drone} />
          <img width="70px" alt="icon" src={bitcoin} />
        </div>
        <br />
        {body}
        <div style={{position: 'relative', left: '30%', width: '50%'}}>
          {connectionStatus}
          <br /><br />
        </div>
        <span>
          <strong>donations:</strong> venmo - <a target="_blank" href="https://venmo.com/jro_bot">@jro_bot</a> // paypal - <a target="_blank" href="http://paypal.me/botjro">paypal.me/botjro</a> // bitcoin address - bc1q2lt90zwmal6m8vvsn07kqnvqtptfvlwrj8wp8g
        </span>
      </div>
    )

  }

  _validateFilePath(pathNumber: number): boolean {
    const filePathReference = `filePath${pathNumber}`;
    const filePath = this.state[filePathReference];
    if (filePath) {
      try {
        fs.readFileSync(filePath, 'utf8');
      } catch (e) {
        alert(`invalid file path for ${filePath}. plz fix ur sh*t`);
        return false;
      }
    }
    return true;
  }

  _replaceFilePathContent(message: string, pathNumber: number): string {
    const filePath = this.state[`filePath${pathNumber}`]
    if (!!filePath) {
      var content = fs.readFileSync(filePath, 'utf8');
      return message.replace(`$${pathNumber}`, content);
    } else {
      return message;
    }
  }

  fileHandler(fileNumber: string) {
    const filePath = `filePath${fileNumber}`;
    return (
      <span>
        <input style={{display: 'none'}} id={filePath} type="file" onChange={(e) => {this.setPath(e, fileNumber)}} accept=".txt" />
        <span style={{cursor: 'pointer'}} onClick={() => { document.getElementById(filePath)?.click()}}>
          <img width="25px" alt="icon" src={fileUpload} />
          {this.fileName(this.state[filePath])}
        </span>
        <img width="25px" alt="icon" title="delete file" src={deleteFile} style={{cursor: 'pointer'}} onClick={() => {this.clearFilePath(filePath)}}/>
        <br/><br/>
      </span>
    )
  }

  clearFilePath(filePath: string) {
    const newFilePath: any = {};
    newFilePath[filePath] = '';
    this.setState(newFilePath);
  }

  settings() {
    return (
      <div>
        <strong>username:</strong> <input type="text" value={this.state.username} onChange={(e) => {this.setState({username: e.currentTarget.value})}} /><br/><br/>
        this is a twitch chat oauth password, which you can get <a href="https://twitchapps.com/tmi/" target="_blank">here</a><br />
        <strong>password:</strong><input type="text" value={this.state.password} onChange={(e) => {this.setState({password: e.currentTarget.value})}} /><br/><br/>
        this is a comma separated list of channels (twitch usernames) you want to connect your bot to. <br/>
        <strong>channels</strong>: <input type="text" value={this.state.channels} onChange={(e) => {this.setState({channels: e.currentTarget.value})}} /><br/><br/>
      </div>
    )
  }

  editableConfig() {
    return (
      <div style={{width: '900px'}}>
        <div style={{display: 'inline-block', width: '60%'}}>
          <div style={{height: '485px', overflowY: 'scroll', marginRight: '15px'}}>
            this is what should be used by viewers to run the message in chat. <br />
            <strong>command</strong>: <input type="text" value={this.state.command} onChange={(e) => {this.setState({command: e.currentTarget.value})}} /><br/><br/>
            <strong>message</strong>: <textarea rows="6" cols="40" maxLength="500" value={this.state.message} onChange={(e) => {this.setState({message: e.currentTarget.value})}} /><br/><br/>

            <strong>command 2</strong>: <input type="text" value={this.state.command2} onChange={(e) => {this.setState({command2: e.currentTarget.value})}} /><br/><br/>
            <strong>message 2</strong>: <textarea rows="6" cols="40" maxLength="500" value={this.state.message2} onChange={(e) => {this.setState({message2: e.currentTarget.value})}} /><br/><br/>

            <strong>command 3</strong>: <input type="text" value={this.state.command3} onChange={(e) => {this.setState({command3: e.currentTarget.value})}} /><br/><br/>
            <strong>message 3</strong>: <textarea rows="6" cols="40" maxLength="500" value={this.state.message3} onChange={(e) => {this.setState({message3: e.currentTarget.value})}} /><br/><br/>

            <strong>command 4</strong>: <input type="text" value={this.state.command4} onChange={(e) => {this.setState({command4: e.currentTarget.value})}} /><br/><br/>
            <strong>message 4</strong>: <textarea rows="6" cols="40" maxLength="500" value={this.state.message4} onChange={(e) => {this.setState({message4: e.currentTarget.value})}} /><br/><br/>

            <strong>command 5</strong>: <input type="text" value={this.state.command5} onChange={(e) => {this.setState({command5: e.currentTarget.value})}} /><br/><br/>
            <strong>message 5</strong>: <textarea rows="6" cols="40" maxLength="500" value={this.state.message5} onChange={(e) => {this.setState({message5: e.currentTarget.value})}} /><br/><br/>
          </div>
        </div>
        <div style={{display: 'inline-block', width: '40%'}}>
          {this.settings()}
          <div style={{height: '300px', overflowY: 'scroll'}}>
            variable <strong>$1</strong>: {this.fileHandler('1')}
            variable <strong>$2</strong>: {this.fileHandler('2')}
            variable <strong>$3</strong>: {this.fileHandler('3')}
            variable <strong>$4</strong>: {this.fileHandler('4')}
            variable <strong>$5</strong>: {this.fileHandler('5')}
            variable <strong>$6</strong>: {this.fileHandler('6')}
            variable <strong>$7</strong>: {this.fileHandler('7')}
            variable <strong>$8</strong>: {this.fileHandler('8')}
            variable <strong>$9</strong>: {this.fileHandler('9')}
            variable <strong>$10</strong>: {this.fileHandler('10')}
          </div>
        </div>
      </div>
    );
  }
}

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={CommandConfig} />
      </Switch>
    </Router>
  );
}