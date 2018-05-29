const Discord = require('discord.js');
const client = new Discord.Client();
const settings = require('./settings.json');

client.on('ready', () => {
    console.log('I\'m online\nI\'m online');
});

var prefix = '+';

client.on('message', message => {
    if (message.author === client.user) return;
    if (message.content.startsWith('ping')) {
        message.channel.send('ping');
    }
});

client.login(settings.token);