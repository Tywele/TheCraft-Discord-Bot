const Discord = require('discord.js');
const client = new Discord.Client();
const settings = require('./settings.json');

// https://github.com/xivdb/api

// react to starting the bot
client.on('ready', () => {
    console.log('I\'m online\nI\'m online');
    client.user.setActivity('FFXIV Market')
});

// react to messages
client.on('message', message => {
    // stop when message has no prefix
    if (!message.content.startsWith(settings.prefix)) return;

    // get cmd args
    let args = message.content.slice(settings.prefix.length).trim().split(';');
    let command = args.shift().toLowerCase(); 

    for (var i = 0; i < args.length; i++) {
        args[i] = args[i].trim();
    }

    console.log(command);
    console.log(args);

    // stop bot from responding to itself
    if (message.author.bot) return;

    if (message.content.startsWith(settings.prefix + 'ping')) {
        message.channel.send(`Pong! \`${Date.now() - message.createdTimestamp} ms\``);
    } else 

    // request gathering
    if (message.content.startsWith(settings.prefix + 'request')) {
        
        let item;
        let count;

        if (typeof(args[0]) === 'string') {
            item = args[0];
        } else {
            message.channel.send(`First argument must be an item name`);
        }

        if (typeof(parseInt(args[1])) === 'number') {
            count = parseInt(args[1]);
        } else {
            message.channel.send(`Second argument must be a number`);
        }

        console.log(`${item} ${count} ${Date.now()}`);

        message.channel.send(`Request \`${Date.now()}\` placed by ${message.author.username}: ${item} (link to DB) x${count}`);
       
    }
});

// login the bot
client.login(settings.token);