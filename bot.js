var Discord = require('discord.io');
var logger = require('winston');
require('dotenv').config();
const { createConnection } = require('mysql');
const { Console } = require('winston/lib/winston/transports');
var url = require('url'); 
var querystring = require('querystring');

const database = createConnection({
    host: 'localhost',
    user: process.env.DBUSER_NAME,
    password: process.env.DBUSER_PASS,
    database: 'jashebot_db',
});

var dateChannel = process.env.DATE_CHANNEL;

class Date{
    constructor(){
        this._id = 0;
        this._date = "";
        this._isDone = 0;
    }

    get id(){
        return this._id;
    }
    get date(){
        return this._date;
    }
    get isDone(){
        return this._isDone;
    }
    set id(val){
        this._id = val;
    }
    set date(val){
        this._date = val;
    }
    set isDone(val){
        this._isDone = val;
    }
}

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

            // Add date to the database (id, date, isDone)
            case 'adddate':
                var dateStr = "";
                args.forEach(item => {
                    dateStr += item + " ";
                });
                dateStr = dateStr.substring(0, dateStr.length-1);

                function insertIntoDB(err, dateObj){
                    if(err) throw err;
                    else{
                        database.query("INSERT INTO dateideas(id, date, isDone) VALUES ?", [[[dateObj.id, dateObj.date, 0]]], function(err, results){
                            if (err){
                                bot.sendMessage({
                                    to:dateChannel,
                                    message: err
                                });
                            }
                            else{
                                bot.sendMessage({
                                    to:dateChannel,
                                    message: "Added \"" + dateObj.date + "\" to the list. Yay!"
                                });
                            }
                        });   
                    }
                }

                function fetchID_adddate(dateObj, callback){
                    database.query("SELECT MAX(id) AS maxid FROM dateideas", function(err, result){
                        if(result[0].maxid != undefined){
                            if(err){
                                callback(err, null);
                            }
                            else{
                                dateObj.id = result[0].maxid + 1;
                                callback(null, dateObj);
                            }
                        }
                        else{
                            dateObj.id = 0;
                            callback(null, dateObj);
                        }
                    });
                }
                
                var d = new Date();
                d.date = dateStr;
                fetchID_adddate(d, insertIntoDB);
                break;

            // Pull a random date from the database and reccommend it
            case 'dateidea':
                var sql = "SELECT date FROM dateideas WHERE isDone = 0 ORDER BY RAND() LIMIT 1";
                database.query(sql, function(err, result, fields){
                    if (err){
                        bot.sendMessage({
                            to:dateChannel,
                            message: err
                        });
                    }
                    else{
                        if(result[0] == undefined){
                            bot.sendMessage({
                                to:dateChannel,
                                message:"There arent any undone dates to choose from!"
                            });
                        }
                        else{
                            bot.sendMessage({
                                to:dateChannel,
                                message: "We should do: " + result[0].date + "!"
                            });
                        }
                    }       
                });
                break;

            // Clear all rows on the date database
            case 'cleardates':
                var sql = "TRUNCATE table dateideas";
                database.query(sql, function(err, result, fields){
                    if (err){
                        bot.sendMessage({
                            to:dateChannel,
                            message: err
                        });
                    }
                    else{
                        bot.sendMessage({
                            to:dateChannel,
                            message: "Clearing all dates :frowning2:"
                        });
                    }
                });
                break;

            // List all currently entered date ideas
            case 'datelist':
                var sql = "SELECT date, isDone FROM dateideas";
                var list = "**Here are all of our dates!**\n";
                database.query(sql, function(err, result, fields){
                    if(result[0] != undefined){
                        if(err){
                            bot.sendMessage({
                                to:dateChannel,
                                message: err
                            });
                        }
                        else{
                            result.forEach(item => {
                                var doneMsg = "";
                                if(item.isDone) doneMsg = "Done!";
                                else doneMsg = "Undone!"
                                list += item.date + "\t" + doneMsg + "\n";
                            });
                            bot.sendMessage({
                                to:dateChannel,
                                message: list
                            });
                        }
                    }
                    else{
                        bot.sendMessage({
                            to:dateChannel,
                            message: "There aren't any dates added :sob:\nTry adding some using **!adddate**"
                        });
                    }
                });
                break;

            // Mark existing date as finished
            case 'datedone':
                argStr = "";
                args.forEach(item => {
                    argStr += item + " ";
                });
                argStr = argStr.substring(0, argStr.length-1);

                function updateDB(err, id){
                    if(err){
                        bot.sendMessage({
                            to:dateChannel,
                            message:"Seems like I can't find that date :confused: try making sure it's added by using **!datelist**"
                        });
                    }
                    else{
                        database.query("UPDATE dateideas SET isDone = 1 WHERE id = ?", [[[id]]], function(err, result, fields){
                            if(err) throw err;
                            else{
                                bot.sendMessage({
                                    to:dateChannel,
                                    message:"That date is now marked as done! :grin:"
                                });
                            }
                        });
                    }
                }
                function fetchID_datedone(date, callback){
                    database.query("SELECT id FROM dateideas WHERE date = ?", [[[date]]], function(err, result, fields){
                        if(err){
                            bot.sendMessage({
                                to:dateChannel,
                                message:"Seems like I can't find that date :confused: try making sure it's added by using **!datelist**"
                            });
                        }
                        else{
                            callback(null, result[0].id);
                        } 
                    });
                }

                fetchID_datedone(argStr, updateDB);
                break;

            case 'help':
                 bot.sendMessage({
                    to:channelID,
                    message:"Here are a list of commands available:\n\n**Date List**\n**--------------**\n**!adddate** - Adds date to the date list\n**!dateidea** - Gives a random date idea from list that hasn't already been done\n**!datelist** - Displays all current dates on the list with their status (done/not done)\n**!datedone** - Mark an undone date as done\n**!cleardates** - Clears the date list (cannot be undone)"
                })
                break;

            default:
                bot.sendMessage({
                    to:channelID,
                    message:"Im afraid I don't understand that command :confused: use **!help** for a listing of all commands!"
                })
         }
     }
});