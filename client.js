const tmi = require('tmi.js');
const fs = require('fs');
const dateFormat = require("dateformat");

var config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

var channels = config.channels.split(',');

const client = new tmi.Client({
  options: { debug: true },
  connection: {
    secure: true,
    reconnect: true
  },
  identity: {
    username: config.username,
    password: config.password
  },
  channels: channels,
  logger: {
    info: (message) => {},
    warn: (message) => {},
    error: (message) => {console.log('error', message)}
  }
});

client.connect();


client.on('message', (channel, tags, message, self) => {
  if (message == config.command) {
    console.log(`@${tags.username} requested info from ${channel} at ${dateFormat(new Date(), 'dddd, mmmm dS, yyyy, h:MM:ss TT')}`);
    var content = fs.readFileSync('./dodo.txt', 'utf8');
    var message = config.message.replace('$1', content)
    client.say(channel, message);
  }
  return;
});