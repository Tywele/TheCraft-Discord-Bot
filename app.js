const Discord = require('discord.js');
const client = new Discord.Client();
const settings = require('./settings.json');
const snekfetch = require('snekfetch');
const api = 'https://api.xivdb.com/search?string='; // https://github.com/xivdb/api
const sql = require('sqlite');

// open sqlite file
sql.open('./log.sqlite');

// react to starting the bot
client.on('ready', () => {
    console.log('I\'m online\nI\'m online');
    client.user.setActivity('FFXIV Market');

    sql.run('CREATE TABLE IF NOT EXISTS users (userId TEXT, name TEXT)');
    sql.run('CREATE TABLE IF NOT EXISTS requests (item TEXT, amount INTEGER, id TEXT, accepted BOOLEAN)');
    sql.run('CREATE TABLE IF NOT EXISTS offers (item TEXT, price INTEGER, quality TEXT, id TEXT, sold BOOLEAN)');
    sql.run('CREATE TABLE IF NOT EXISTS userHasRequests(userId TEXT, requestId TEXT)');
    sql.run('CREATE TABLE IF NOT EXISTS userHasOffers(userId TEXT, offerId TEXT)');
});

// react to messages
client.on('message', message => {

    // stop when message has no prefix
    if (!message.content.startsWith(settings.prefix)) return;

    // stop bot from responding to itself
    if (message.author.bot) return;

    // create user entry in DB
    sql.get('SELECT * FROM users WHERE userId = ?', [message.author.id]).then(row => {
        if (!row) {
            sql.run('INSERT INTO users (userId, name) VALUES (?, ?)', [message.author.id, message.author.username]);
        }
    });

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
        let id;

        // stop processing command if not enough arguments
        if (args.length != 2) {
            message.channel.send('Info! Requesting an item to be gathered works as follows: \`+request;[item];[amount]\`\nThe name must be provided in English.');
            return;
        }

        // check if first argument is a string
        if (typeof (args[0]) === 'string') {
            item = args[0];
        } else {
            message.channel.send(`Error! Please provide an item name`);
            return;
        }

        // check if second argument is a number
        if (!isNaN(args[1])) {
            amount = parseInt(args[1]);
        } else {
            message.channel.send(`Error! Please provide a number`);
            return;
        }

        // call api.xivdb.com
        snekfetch.get(api + item + '&one=items').then(r => {
            let url;
            let db_url;
            if (r.body.items.results.length <= 0) url = "";
            else {
                url = r.body.items.results[0].url_api;
                db_url = r.body.items.results[0].url_xivdb;
            }
            if (url !== "") {
                snekfetch.get(url).then(t => {
                    name_de = t.body.name_de;
                    name_en = t.body.name_en;
                    name_ja = t.body.name_ja;
                    name_fr = t.body.name_fr;
                    id = parseInt(Date.now()).toString();
                    embed = new Discord.RichEmbed()
                        .setDescription(`${name_en}\n${name_de}\n${name_fr}\n${name_ja}\n\nID: \`${id}\`\n\nType \`+accept;[id]\` to accept the request.`)
                        .setTitle(db_url)
                        .setURL(db_url)
                        .setAuthor(`${message.author.username} requests x${amount}`);

                    message.channel.send({
                        embed: embed
                    });

                    // insert to DB
                    sql.run('INSERT INTO requests (item, amount, id, accepted) VALUES (?, ?, ?, ?)', [item, amount, id, 0]);
                    sql.run('INSERT INTO userHasRequests (userId, requestID) VALUES (?, ?)', [message.author.id, id]);
                });
            } else {
                id = parseInt(Date.now()).toString();
                embed = new Discord.RichEmbed()
                    .setDescription(`No item with the provided name found\n\nID: \`${id}\`\n\nType \`+accept;[id]\` to accept the request.`)
                    .setTitle(db_url)
                    .setURL(db_url)
                    .setAuthor(`${message.author.username} requests x${amount} of ${item}`);

                message.channel.send({
                    embed: embed
                });

                // insert to DB
                sql.run('INSERT INTO requests (item, amount, id, accepted) VALUES (?, ?, ?, ?)', [item, amount, id, 0]);
                sql.run('INSERT INTO userHasRequests (userId, requestID) VALUES (?, ?)', [message.author.id, id]);
            }
        });
    } else

        // accept request
        if (message.content.startsWith(settings.prefix + 'accept')) {

            let id;

            // stop processing command if not enough arguments
            if (args.length != 1) {
                message.channel.send('Info! Accepting a request works as follows: \`+accept;[id]\`');
                return;
            }

            // check if first argument is a number
            if (!isNaN(args[0])) {
                id = parseInt(args[0]);
            } else {
                message.channel.send(`Error! Please provide a number`);
                return;
            }

            sql.get(`SELECT * FROM requests WHERE id = ${id}`).then(row => {
                if (row.accepted == 1) {
                    message.channel.send('This request has already been accepted.');
                    return;
                }
                let embed = new Discord.RichEmbed().setDescription(`${message.author.username} accepted the request to gather ${row.item} x${row.amount}`);
                message.channel.send({
                    embed: embed
                });
            });
            sql.run(`UPDATE requests SET accepted = 1 WHERE id = ${id}`);
        } else

            // post an item for sale
            if (message.content.startsWith(settings.prefix + 'offer')) {
                let item;
                let quality;
                let name_de;
                let name_en;
                let name_fr;
                let name_ja;
                let price;
                let id;
                let embed;

                // stop processing command if not enough arguments
                if (args.length != 3) {
                    message.channel.send('Info! Posting an item for sale works as follows: \`+offer;[item];[price];[quality]\`\nThe must be provided in English.');
                    return;
                }

                if (typeof (args[0]) === 'string') {
                    item = args[0];
                } else {
                    message.channel.send(`Error! Please provide an item name`);
                    return;
                }

                if (!isNaN(args[1])) {
                    price = parseInt(args[1]);
                } else {
                    message.channel.send('Error! Please provide a number');
                    return;
                }

                if (args[2].toLowerCase() == 'nq' || args[2].toLowerCase() == 'hq') {
                    quality = args[2];
                    quality = quality.toUpperCase();
                } else {
                    message.channel.send('Error! Quality must be either \`NQ\` or \`HQ\`');
                    return;
                }

                // call api.xivdb.com
                snekfetch.get(api + item + '&one=items').then(r => {
                    let url;
                    let db_url;
                    if (r.body.items.results.length <= 0) url = "";
                    else {
                        url = r.body.items.results[0].url_api;
                        db_url = r.body.items.results[0].url_xivdb;
                    }
                    if (url !== "") {
                        snekfetch.get(url).then(t => {
                            name_de = t.body.name_de;
                            name_en = t.body.name_en;
                            name_ja = t.body.name_ja;
                            name_fr = t.body.name_fr;
                            id = parseInt(Date.now()).toString();
                            embed = new Discord.RichEmbed()
                                .setDescription(`${name_en}\n${name_de}\n${name_fr}\n${name_ja}\n\nID: \`${id}\`\n\nType \`+buy;[id]\` to buy the item.`)
                                .setTitle(db_url)
                                .setURL(db_url)
                                .setAuthor(`${message.author.username} sells below item for ${price} Gil`);

                            message.channel.send({
                                embed: embed
                            });

                            // insert to DB
                            sql.run('INSERT INTO offers (item, price, quality, id, sold) VALUES (?, ?, ?, ?, ?)', [item, price, quality, id, 0]);
                            sql.run('INSERT INTO userHasOffers (userId, offerID) VALUES (?, ?)', [message.author.id, id]);
                        });
                    } else {
                        id = parseInt(Date.now()).toString();
                        embed = new Discord.RichEmbed()
                            .setDescription(`No item with the provided name found\n\nID: \`${id}\`\n\nType \`+buy;[id]\` to buy the item.`)
                            .setTitle(db_url)
                            .setURL(db_url)
                            .setAuthor(`${message.author.username} sells ${item} for ${price} Gil`);

                        message.channel.send({
                            embed: embed
                        });

                        // insert to DB
                        sql.run('INSERT INTO offers (item, price, quality, id, sold) VALUES (?, ?, ?, ?, ?)', [item, price, quality, id, 0]);
                        sql.run('INSERT INTO userHasOffers (userId, offerID) VALUES (?, ?)', [message.author.id, id]);
                    }
                });
            } else

                // accept offer
                if (message.content.startsWith(settings.prefix + 'buy')) {

                    let id;

                    // stop processing command if not enough arguments
                    if (args.length != 1) {
                        message.channel.send('Info! Accepting an offer works as follows: \`+buy;[id]\`');
                        return;
                    }

                    // check if first argument is a number
                    if (!isNaN(args[0])) {
                        id = parseInt(args[0]);
                    } else {
                        message.channel.send(`Error! Please provide a number`);
                        return;
                    }

                    sql.get(`SELECT * FROM offers WHERE id = ${id}`).then(row => {
                        if (row.sold == 1) {
                            message.channel.send('This offer has already been bought.');
                            return;
                        }
                        let embed = new Discord.RichEmbed().setDescription(`${message.author.username} wants to buy ${row.item} in ${row.quality} for ${row.price} Gil`);
                        message.channel.send({
                            embed: embed
                        });
                    });
                    sql.run(`UPDATE offers SET sold = 1 WHERE id = ${id}`);
                } else

                    // list all requests or sale offers
                    if (message.content.startsWith(settings.prefix + 'list')) {
                        let list = ``;

                        // stop processing command if not enough arguments
                        if (args.length != 1) {
                            message.channel.send('Info! Getting a list of requests or sale offers works as follows: \`+list;requests\` or \`+list;offers\`');
                            return;
                        }

                        if (args[0] === 'requests') {
                            sql.each('SELECT * FROM requests WHERE accepted = 0', (err, row) => {
                                if (!err) list += `\`${row.id}\` \`x${row.amount}\` \`${row.item}\`\n`;
                            }).then(t => {
                                if (list !== "") message.channel.send(list);
                                else message.channel.send('No requests are currently listed');
                            });
                        }

                        if (args[0] === 'offers') {
                            sql.each('SELECT * FROM offers WHERE sold = 0', (err, row) => {
                                if (!err) list += `\`${row.id}\` \`${row.quality}\` \`${row.price}\` Gil \`${row.item}\`\n`;
                            }).then(t => {
                                if (list !== "") message.channel.send(list);
                                else message.channel.send('No offers are currently listed');
                            });
                        }
                    }

    // help command
    if (message.content.startsWith(settings.prefix + 'help')) {
        message.channel.send({
            embed: {
                "title": "Available Commands",
                "fields": [{
                        "name": "+request;[item];[count]",
                        "value": "Use this command if you need items gathered from someone.\nThe item name has to be provided in English so that the automatic search will work."
                    },
                    {
                        "name": "+accept;[id]",
                        "value": "Use this command to accept a posted request."
                    },
                    {
                        "name": "+offer;[item];[price];[quality]",
                        "value": "Use this command to offer an item for sale.\nThe item name has to be provided in English so that the automatic search will work.\nQuality has to be provided as either NQ or HQ."
                    },
                    {
                        "name": "+buy;[id]",
                        "value": "Use this command if you want to buy an item from a posted offer."
                    },
                    {
                        "name": "+list;[requests|offers]",
                        "value": "Use this command to either list all available requests or offers."
                    },
                    {
                        "name": "Github",
                        "value": "https://github.com/Tywele/TheCraft-Discord-Bot"
                    }
                ]
            }
        });
    }
});

// login the bot
client.login(settings.token);