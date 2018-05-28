const Discord = require('discord.js');
const client = new Discord.client();
const settings = require('./settings.json');

client.on('ready', () => {
    console.log('I\'m online\nI\'m online');
});

client.on('message', message => {
    if (message === 'ping') {
        message.reply('pong');
    }
});

client.login(settings.token);