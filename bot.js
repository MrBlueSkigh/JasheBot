var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

const jadeTag = "<@689524675516432436>";
const joshTag = "<@177588140557467648>";
var dateIdeas = Array();

// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
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
                    message: '<@177588140557467648> test'
                });
                break;

            case 'ilyjade':
                bot.sendMessage({
                    to:channelID,
                    message: jadeTag + ", I love you :) <3"
                });
                break;

            case 'ilyjosh':
                bot.sendMessage({
                    to:channelID,
                    message: joshTag + ", I love you :) <3"
                });
                break;

            case 'adddate':
                var date = "";
                args.forEach(item => {
                    date += item + " ";
                });
                dateIdeas.push(date);
                bot.sendMessage({
                    to:channelID,
                    message: "Added \"" + date + "\" to the list! Yay!"
                });
                break;

            case 'dateidea':
                var randomDate = dateIdeas[Math.floor(Math.random() * dateIdeas.length)];
                console.log(randomDate);
                bot.sendMessage({
                    to:channelID,
                    message: "We should do: " + randomDate + "!"
                });
                break;

            case 'cleardates':
                dateIdeas.splice(0, dateIdeas.length);
                bot.sendMessage({
                    to:channelID,
                    message: "Clearing all stored dates"
                });
                break;

            case 'datelist':
                var dateList = "";
                dateIdeas.forEach(date => {
                    dateList = dateList + date + "\n";
                });

                if(dateIdeas.length == 0){
                    bot.sendMessage({
                        to:channelID,
                        message: "Oh no! There are no dates stored!"
                    });
                }
                else{
                    bot.sendMessage({
                        to:channelID,
                        message: dateList
                    });   
                }
                break;
         }
     }
});