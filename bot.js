var Discord = require('discord.io');
var logger = require('winston');
require('dotenv').config();

const { createConnection } = require('mysql');
const { Console } = require('winston/lib/winston/transports');
const database = createConnection({
    host: 'localhost',
    user: 'dbuser',
    password: process.env.DBUSER_PASS,
    database: 'jashebot_db',
});

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
var bot = new Discord.Client({
   token: process.env.SECRET_TOKEN,
   autorun: true
});

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');

    database.connect(function(err){
        if (err) throw err;
        console.log("Connected to jashebot_db");
    });
});

bot.on('message', function (user, userID, channelID, message, evt) {
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            case 'ping':
                bot.sendMessage({
                    to: channelID,
                    message: ':cowboy:'
                });
                break;

            case 'adddate':
                var date = "";
                args.forEach(item => {
                    date += item + " ";
                });
                var sql = "INSERT INTO dateideas(date) VALUES (\'"+date+"\')";
                database.query(sql, function(err, result){
                    if (err){
                        bot.sendMessage({
                            to:channelID,
                            message: err
                        });
                    }
                    else{
                        bot.sendMessage({
                            to:channelID,
                            message: "Added \"" + date + "\" to the list. Yay!"
                        });
                    }
                });
                break;

            case 'dateidea':
                var sql = "SELECT date FROM dateideas ORDER BY RAND() LIMIT 1";
                database.query(sql, function(err, result, fields){
                    if(result[0] != undefined){
                        if (err){
                            bot.sendMessage({
                                to:channelID,
                                message: err
                            });
                        }
                        else{
                            bot.sendMessage({
                                to:channelID,
                                message: "We should do: " + result[0].date + "!"
                            });
                        }       
                    }
                    else{
                        bot.sendMessage({
                            to:channelID,
                            message: "No dates to choose from :cry:\nTry adding some using !adddate"
                        });
                    }
                });
                break;

            case 'cleardates':
                var sql = "TRUNCATE table dateideas";
                database.query(sql, function(err, result, fields){
                    if (err){
                        bot.sendMessage({
                            to:channelID,
                            message: err
                        });
                    }
                    else{
                        bot.sendMessage({
                            to:channelID,
                            message: "Clearing all dates :frowning2:"
                        });
                    }
                });
                break;

            case 'datelist':
                var sql = "SELECT date FROM dateideas";
                var list = "**Here are all of our dates!**\n";
                database.query(sql, function(err, result, fields){
                    if(result[0] != undefined){
                        if(err){
                            bot.sendMessage({
                                to:channelID,
                                message: err
                            });
                        }
                        else{
                            result.forEach(item => {
                                list += item.date + "\n"
                            });
                            bot.sendMessage({
                                to:channelID,
                                message: list
                            });
                        }
                    }
                    else{
                        bot.sendMessage({
                            to:channelID,
                            message: "There aren't any dates added :sob:\nTry adding some using !adddate"
                        });
                    }
                });
                break;
         }
     }
});