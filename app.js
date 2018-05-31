const Discord = require('discord.js');
const client = new Discord.Client();
const settings = require('./settings.json');
const snekfetch = require('snekfetch');
const api = 'https://api.xivdb.com/search?string=';

// https://github.com/xivdb/api
// item api => name_de, name_en, name_fr, name_ja

// react to starting the bot
client.on('ready', () => {
    console.log('I\'m online\nI\'m online');
    client.user.setActivity('FFXIV Market')
});

// react to messages
client.on('message', message => {

    // stop when message has no prefix
    if (!message.content.startsWith(settings.prefix)) return;

    // stop bot from responding to itself
    if (message.author.bot) return;

    // get cmd args
    let args = message.content.slice(settings.prefix.length).trim().split(settings.delimiter);
    let command = args.shift().toLowerCase(); 

    for (var i = 0; i < args.length; i++) {
        args[i] = args[i].trim();
    }

    console.log(command);
    console.log(args);

    // request gathering
    if (message.content.startsWith(settings.prefix + 'request')) {
        
        let item;
        let amount;
        let name_de;
        let name_en;
        let name_ja;
        let name_fr;
        let embed;

        // stop processing command if not enough arguments
        if (args.length < 2) {
            message.channel.send('Info! Requesting an item to be gathered works as follows: \`+request;item;amount\`\nThe name must be provided in English');
            return;
        }

        // check if first argument is a string
        if (typeof(args[0]) === 'string') {
            item = args[0];
        } else {
            message.channel.send(`Error! Please provide an item name`);
            return;
        }

        // check if second argument is a number
        if (typeof(parseInt(args[1])) === 'number') {
            amount = parseInt(args[1]);
        } else {
            message.channel.send(`Error! Please provide a number`);
            return;
        }

        // call api.xivdb.com
        snekfetch.get(api + item + '&one=items').then(r => {
            let url = r.body.items.results[0].url_api;
            let db_url = r.body.items.results[0].url_xivdb;
            snekfetch.get(url).then(t => {
                name_de = t.body.name_de;
                name_en = t.body.name_en;
                name_ja = t.body.name_ja;
                name_fr = t.body.name_fr;
                embed = new Discord.RichEmbed()
                    .setDescription(`${name_en}\n${name_de}\n${name_fr}\n${name_ja}\n\nID: \`${Date.now()}\`\n\nType \`+accept;[id]\` to accept the request`)
                    .setTitle(db_url)
                    .setURL(db_url)
                    .setAuthor(`${message.author.username} requests x${amount}`);

                message.channel.send({embed: embed});
            });
        });
    }
});

// login the bot
client.login(settings.token);