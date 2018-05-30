const Discord = require('discord.js');
const client = new Discord.Client();
const settings = require('./settings.json');

// react to starting the bot
client.on('ready', () => {
    console.log('I\'m online\nI\'m online');
});

// react to messages
var prefix = '+';
client.on('message', message => {
    // stop when message has no prefix
    if (!message.content.startsWith(prefix)) return;

    // get cmd args
    let args = message.content.split(' ').slice(1);
    let argresult = args.join(' '); 

    // stop bot from responding to itself
    if (message.author.bot) return;

    if (message.content.startsWith(prefix + 'ping')) {
        message.channel.send(`Pong! \`${Date.now() - message.createdTimestamp} ms\``);
    } else 

    // set game of bot
    if (message.content.startsWith(prefix + 'setgame')) {
        client.user.setActivity(argresult);
    } else

    // send message to different channel
    if (message.content.startsWith(prefix + 'send')) {
        client.channels.get('140508702284185600').send('Hello from bot-sandbox');
    }
});

// login the bot
client.login(settings.token);