const { clientId, guildId, token} = require('./config.json');
const Discord = require('discord.js');
const fs = require('fs');
const client = new Discord.Client({ intents: [
  "GUILDS" ,
  "GUILD_MEMBERS" ,
  "GUILD_INTEGRATIONS" ,
  "GUILD_MESSAGES" ,
  "GUILD_MESSAGE_REACTIONS"] });

/*
    TODO:
      clickable challenge links in player stats
*/

  const announceChannel = `1009895079986593812`;
  const challengeChannel = `1009895219765968966`;
  const botChannel = `1009895387605254174`;
  const errorChannel = `957300463320064051`;
  const rolePing = `1009901251951079574`;

  //Broadcasts the challenges
  var checkminutes = 1,
     checkthe_interval = checkminutes * 60 * 1000; //This checks every x minutes, change 1 to whatever minute you'd like
  setInterval(async function() {
    const config = require('./config.json');
    const cf = require('./challenges.json');
    const oneMin = 60000;

    if(config.isStarted){
      if(Math.floor(Date.now()) - config.lastChallenged > oneMin * 60 * 24 * 7){
        if(config.currentWeek == config.lastWeek){
          config.isStarted = false;
          client.guilds.cache.get(guildId)
            .channels.cache.get(announceChannel)
            .send(`<@&` + rolePing + `> The tournament has ended, thanks to everyone for participating!`)
          fs.writeFile('./config.json', JSON.stringify(config , null , 2) , err => {
            if (err) {
              console.error(err)
              //return
            }
          })
          return;
        }
        config.currentWeek++;
        for(var j = 0 ; j < cf.challenges.length ; j++){
          if(cf.challenges[j].week == config.currentWeek && cf.challenges[j].messageId < 0){
            var messId;
            var challengeMessageId;
            message = await client.guilds.cache.get(guildId).channels.cache.get(challengeChannel).send(challToString(cf.challenges[j]))
            /*.catch(function() {
              client.guilds.cache.get(guildId).channels.cache.get(errorChannel).send(`Something went wrong while broadcasting ${cf.challenges[i].name}`);
            });*/
            challengeMessageId = message.id;
            //console.log(challengeMessageId)
            if(!(cf.challenges[j].isWaveBased)){
              message = await client.guilds.cache.get(guildId).channels.cache.get(challengeChannel).messages.fetch(challengeMessageId)
              message.react("✅");
            }
            cf.challenges[j].messageId = challengeMessageId;
            cf.challenges[j].channelId = challengeChannel;
          }
        }

        config.lastChallenged = Math.floor(Date.now());
        client.guilds.cache.get(guildId)
          .channels.cache.get(announceChannel)
          .send(`<@&` + rolePing + `> Challenges for week ${config.currentWeek} have been released in <#${challengeChannel}>`)

        fs.writeFile('./challenges.json', JSON.stringify(cf , null , 2) , err => {
          if (err) {
            console.error(err)
            //return
          }
        })
        fs.writeFile('./config.json', JSON.stringify(config , null , 2) , err => {
          if (err) {
            console.error(err)
            //return
          }
        })
      }
    }

  }, checkthe_interval);

  //Bot launch things
  client.once('ready', () => {

    const pf = require('./players.json');
    const cf = require('./challenges.json');

    client.guilds.cache.get(guildId).channels.fetch(announceChannel);
    client.guilds.cache.get(guildId).channels.fetch(challengeChannel);
    client.guilds.cache.get(guildId).channels.fetch(botChannel);
    client.guilds.cache.get(guildId).channels.fetch(errorChannel);

    for(var i = 0 ; i < pf.players.length ; i++){ //Fetches all users that are registered in the bot
      client.users.fetch(pf.players[i].id);
    }

    for(var i = 0 ; i < cf.challenges.length ; i++){ //Fetches challenge messages
      if(cf.challenges[i].messageId > 0){
        client.guilds.cache.get(guildId).channels.cache.get(cf.challenges[i].channelId).messages.fetch(cf.challenges[i].messageId);
      }
    }

    //ensureDuplicates();
    recalculatePoints();

    console.log('Ready!');
  });

  //Command Handling
  client.on('interactionCreate', async interaction => {
  	if (!interaction.isCommand()) return;

    console.log(`${interaction.commandName}:${interaction.commandId}`);

  	const { commandName } = interaction;
    const cf = require('./challenges.json');
    const pf = require('./players.json');
    const config = require('./config.json');

    if(commandName == 'completechallenge'){
      const player = interaction.options.getUser('player');
      const challengeToComplete = interaction.options.getString('challenge_name');

      if(!config.isStarted){
        interaction.reply({ content: 'There\'s no tournament currently happening, so no challenges can be completed or decompleted', ephemeral: true });
        return;
      }

      completeChallenge(player , challengeToComplete , interaction , true , pf , cf , null);
    }
    else if (commandName === 'decompletechallenge'){
      //if(!(interaction.user.id == 293132125190750208 || interaction.user.id == 422184269025247233 || interaction.member.roles.cache.has(914379597045444618)) ) return;
      //console.log(`${interaction.user.username} used decompletechallenge`);
      const player = interaction.options.getUser('player');
      const challengeToDecomplete = interaction.options.getString('challenge_name');

      if(!config.isStarted){
        interaction.reply({ content: 'There\'s no tournament currently happening, so no challenges can be completed or decompleted', ephemeral: true });
        return;
      }

      decompleteChallenge(player, challengeToDecomplete, interaction, true, pf, cf);
    }
    else if (commandName == 'completewaves'){
      const player = interaction.options.getUser('player');
      const challengeToComplete = interaction.options.getString('challenge_name');
      const wave = interaction.options.getNumber('wave');

      if(player == null){
        player = interaction.user;
      }

      if(!config.isStarted){
        interaction.reply({ content: 'There\'s no tournament currently happening, so no challenges can be completed or decompleted', ephemeral: true });
        return;
      }

      if(wave < 1){
        interaction.reply('Please specify a wave greater than 0, or use /decompletechallenge if you wish to remove the challenge entirely');
        return;
      }

      completeChallenge(player , challengeToComplete , interaction , true , pf , cf , wave);
    }
    else if (commandName === 'playerstats'){
      sortChallenges()
      var player = interaction.options.getUser("player");
      if(!player){
        player = interaction.user;
      }

      var s1 = '';
      var s2 = '';
      var sWaves = '';
      var playerIndex = -1;

      for(var i = 0 ; i < pf.players.length ; i++){
        if(pf.players[i].id == player.id){
          playerIndex = i;
          break;
        }
      }
      if(playerIndex == -1){
        interaction.reply('This player doesn\'t have any stats yet, complete a challenge to generate stats');
        return;
      }
      if(interaction.options.getString('filter')){
        for(var i = 0 ; i < cf.challenges.length ; i++){
          if(cf.challenges[i].messageId > 0){
            if(cf.challenges[i].name.startsWith(interaction.options.getString('filter'))){
              var bool1 = false;
              var cIndex = -1;
              for (var j = 0 ; j < pf.players[playerIndex].challenges.length ; j++){
                if(cf.challenges[i].name == pf.players[playerIndex].challenges[j].name){
                  bool1 = true;
                  cIndex = j;
                }
              }
              if(cf.challenges[i].isWaveBased){
                sWaves += `${cf.challenges[i].name}: Points Per Wave: **${cf.challenges[i].points}**, Wave Reached: **${(bool1)?(pf.players[playerIndex].challenges[cIndex].waveReached):(0)}**\n`;
              }
              else if(bool1){
                s1 += `${cf.challenges[i].name} **(${cf.challenges[i].points})**\n`;
              }else{
                s2 += `${cf.challenges[i].name} **(${cf.challenges[i].points})**\n`;
              }
            }
          }
        }
      }else{
        for(var i = 0 ; i < cf.challenges.length ; i++){
          if(cf.challenges[i].messageId > 0){
            var bool1 = false;
            var cIndex = -1;
            for (var j = 0 ; j < pf.players[playerIndex].challenges.length ; j++){
              if(cf.challenges[i].name == pf.players[playerIndex].challenges[j].name){
                bool1 = true;
                cIndex = j;
              }
            }
            if(cf.challenges[i].isWaveBased){
              sWaves += `${cf.challenges[i].name}: Points Per Wave: **${cf.challenges[i].points}**, Wave Reached: **${(bool1)?(pf.players[playerIndex].challenges[cIndex].waveReached):(0)}**\n`;
            }
            else if(bool1){
              s1 += `${cf.challenges[i].name} **(${cf.challenges[i].points})**\n`;
            }else{
              s2 += `${cf.challenges[i].name} **(${cf.challenges[i].points})**\n`;
            }
          }
        }
      }
      embedPoints = new Discord.MessageEmbed()
        .setTitle(`**${player.username}'s Stats**`)
        .setDescription(`Total Points: ${pf.players[playerIndex].points}`)
        .setColor("#0000FF")
      embedWaves = new Discord.MessageEmbed()
        .setTitle('**Wave Challenges**')
        .setColor("#FFFF00")
        .setDescription(sWaves)
      embedComplete = new Discord.MessageEmbed()
        .setTitle('**Completed Challenges**')
        .setColor("#00FF00")
        .setDescription(s1)
      embedIncomplete = new Discord.MessageEmbed()
        .setTitle('**Incompleted Challenges**')
        .setColor("#FF0000")
        .setDescription(s2)

      const completed = interaction.options.getString("show_completed")
      if(completed == null || completed == 'false'){
        interaction.reply({ embeds: [embedPoints , embedWaves , embedIncomplete] });
      }else{
        interaction.reply({ embeds: [embedPoints , embedWaves , embedComplete, embedIncomplete] });
      }
    }
    else if (commandName === 'leaderboard'){
      var page = interaction.options.getNumber('page');
      var pageCount = 20;
      if(!page){
        page = 1;
      }
      if(page == 0){
        pageCount = 1000;
      }
      function compare(a,b){
        if(a.points > b.points){
          return -1;
        }else if(b.points > a.points){
          return 1;
        }
        return 0;
      }

      pf.players.sort(compare);
      //console.log(client.users.cache);
      var s = ""
      s+= `**------------------------**\n`
      var count = 1;
      if(page < 0){
        interaction.reply(`Invalid page number. Enter a number >= 0`)
        return;
      }
      for(var i = 0 ; i < pf.players.length ; i++){
        if(client.users.cache.find(user => user.id == pf.players[i].id)){
          if(pf.players[i].id == interaction.user.id){
            if(count > page*pageCount){
              s+= `**------------------------**\n`
            }
            s += `**${count}. ${client.users.cache.find(user => user.id == pf.players[i].id).username} : ${pf.players[i].points}**\n`
            if(count <= (page-1)*pageCount){
              s+= `**------------------------**\n`
            }
          }else if((count > (page-1)*pageCount && count <= page*pageCount)){
            s += `${count}. ${client.users.cache.find(user => user.id == pf.players[i].id).username} : **${pf.players[i].points}**\n`
          }
          count++;
        }
      }
      s+= `**------------------------**\n`

      embed = new Discord.MessageEmbed()
        .setTitle(`**Points Leaderboard**`)
        .setDescription(`${s}`)
        .setColor("#0000FF")
      interaction.reply({embeds: [embed]});
    }
    else if (commandName === 'challengestats'){
      //console.log(client.users.cache)
      challengeToCheck = interaction.options.getString('challenge_name');
      var challengeObj;
      for(var i = 0 ; i < cf.challenges.length ; i++){
        if(cf.challenges[i].name.toLowerCase() == challengeToCheck.toLowerCase()){
          challengeObj = cf.challenges[i];
        }
      }

      if(!challengeObj){
        interaction.reply("Could not find a challenge with that name")
      }else if (!challengeObj.isWaveBased){
        var completeNum = 0;
        var s2 = "";
        for(var i = 0 ; i < pf.players.length ; i++){
          // if(client.users.cache.find(user => user.id == pf.players[i].id))
          //   s2 += `${client.users.cache.find(user => user.id == pf.players[i].id).username}\n`
          for(var j = 0 ; j < pf.players[i].challenges.length ; j++){
            //console.log(`${pf.players[i].challenges[j].name.toLowerCase()}, ${challengeToCheck.toLowerCase()}, ${pf.players[i].challenges[j].name.toLowerCase() == challengeToCheck.toLowerCase()}`)
            if(pf.players[i].challenges[j].name.toLowerCase() == challengeToCheck.toLowerCase()){
              //console.log('Match found!')
              completeNum++;
              if(client.users.cache.find(user => user.id == pf.players[i].id))
                s2 = s2 + `${client.users.cache.find(user => user.id == pf.players[i].id).username}\n`;
            }
          }
        }

        s1 = `**Points gained**: ${challengeObj.points} \n**Completions**: ${completeNum}`

        embedStats = new Discord.MessageEmbed()
          .setTitle(`**Stats for ${challengeObj.name}**`)
          .setColor("#0000FF")
          .setDescription(s1)
        embedCompletions = new Discord.MessageEmbed()
          .setTitle('**Users who\'ve completed this challenge**')
          .setColor("#00FF00")
          .setDescription(s2)
        interaction.reply({ embeds: [embedStats, embedCompletions] });
      }else{
        var page = 1;
        var pageCount = 20;
        function compare(a,b){
          if(a.waveReached > b.waveReached){
            return -1;
          }else if(b.waveReached > a.waveReached){
            return 1;
          }
          return 0;
        }
        completions = [];
        for(var i = 0 ; i < pf.players.length ; i++){
          for(var j = 0 ; j < pf.players[i].challenges.length ; j++){
            if(pf.players[i].challenges[j].name.toLowerCase() ==  challengeToCheck.toLowerCase()){
              completions.push({
                id: pf.players[i].id,
                waveReached: pf.players[i].challenges[j].waveReached
              });
              break;
            }
          }
        }

        completions.sort(compare);
        //console.log(client.users.cache);
        var s = ""
        s+= `**------------------------**\n`
        var count = 1;
        for(var i = 0 ; i < completions.length ; i++){
          if(client.users.cache.find(user => user.id == completions[i].id)){
            if(completions[i].id == interaction.user.id){
              if(count > page*pageCount){
                s+= `**------------------------**\n`
              }
              s += `**${count}. ${client.users.cache.find(user => user.id == completions[i].id).username} : ${completions[i].waveReached}**\n`
              if(count <= (page-1)*pageCount){
                s+= `**------------------------**\n`
              }
            }else if((count > (page-1)*pageCount && count <= page*pageCount)){
              s += `${count}. ${client.users.cache.find(user => user.id == completions[i].id).username} : **${completions[i].waveReached}**\n`
            }
            count++;
          }
        }
        s+= `**------------------------**\n`

        s1 = `**Points gained per wave**: ${challengeObj.points} \n**Completions**: ${completions.length}`

        embedStats = new Discord.MessageEmbed()
          .setTitle(`**Stats for ${challengeObj.name}**`)
          .setColor("#0000FF")
          .setDescription(s1)
        embedCompletions = new Discord.MessageEmbed()
          .setTitle('**Users who\'ve completed this challenge (sorted by wave reached)**')
          .setColor("#00FF00")
          .setDescription(s)
        interaction.reply({ embeds: [embedStats, embedCompletions] });
      }
    }
    else if (commandName === 'editchallenge'){
      sortChallenges()
      if(!(interaction.user.id == 293132125190750208 || interaction.user.id == 422184269025247233)){
        interaction.reply('You don\'t have permission to edit challenges');
        return;
      }
      const challengeName = interaction.options.getString("challenge_name");
      const newName = interaction.options.getString("new_name");
      const points = interaction.options.getNumber("points");
      const description = interaction.options.getNumber("description");
      const rules = interaction.options.getNumber("rules");

      console.log(`Points: ${points}`)

      var pointsDif;
      var challengeFound = false;
      var cIndex = -1;
      for(var i = 0 ; i < cf.challenges.length ; i++){
        if(cf.challenges[i].name.toLowerCase() == challengeName.toLowerCase()){
          challengeFound = true;
          cIndex = i;
          if(points != null){
            pointsDif = points - cf.challenges[i].points;
            cf.challenges[i].points = points;
            console.log(`challenge changed to :${cf.challenges[i].points}`);
          }
          if(newName != null){
            cf.challenges[i].name = newName;
          }
          if(description != null){
            cf.challenges[i].description = description;
          }
          if(rules != null){
            cf.challenges[i].rules = rules;
          }
        }
      }
      console.log(`Pointsdif: ${pointsDif}`)
      var test = false;
      if(challengeFound == true){
        for(var i = 0 ; i < pf.players.length ; i++){
          for(var j = 0 ; j < pf.players[i].challenges.length ; j++){
            if(pf.players[i].challenges[j].name.toLowerCase() == challengeName.toLowerCase()){
              if(points != null){
                pf.players[i].challenges[j].points = points;
                if(cf.challenges[cIndex].isWaveBased){
                  pf.players[i].points += (pointsDif * pf.players[i].challenges[j].waveReached);
                }else{
                  pf.players[i].points += pointsDif;
                }
              }
              if(newName != null){
                pf.players[i].challenges[j].name = newName;
              }
              if(description != null){
                pf.players[i].challenges[j].description = description;
              }
              if(rules != null){
                pf.players[i].challenges[j].rules = rules;
              }
              test = true;
            }
          }
        }
        if(test){
          interaction.reply(`Succesfully edited '${challengeName}'`);
        }else{
          interaction.reply(`Something went wrong`);
        }
      }else{
        interaction.reply(`The challenge'${challengeName}' was not found`);
      }

      if(cf.challenges[cIndex]){
        client.guilds.cache.get(guildId)
          .channels.cache.get(cf.challenges[cIndex].channelId)
          .messages.cache.get(cf.challenges[cIndex].messageId)
          .edit(challToString(cf.challenges[cIndex]));
      }

      fs.writeFile('./challenges.json', JSON.stringify(cf , null , 2) , err => {
        if (err) {
          console.error(err)
          //return
        }
      })
      fs.writeFile('./players.json', JSON.stringify(pf , null , 2) , err => {
        if (err) {
          console.error(err)
          //return
        }
      })
    }
    else if (commandName === 'starthungergames'){
      if(!config.isStarted){
        config.isStarted = true;
        config.startDate = Math.floor(Date.now());
        config.lastChallenged = -1;
        config.currentWeek = 0;
        fs.writeFile('./config.json', JSON.stringify(config , null , 2) , err => {
          if (err) {
            console.error(err)
            //return
          }
        })
        //Math.floor(Date.now()) - playerLog[k].lastPinged > oneMin * 29.5
        interaction.reply({ content: 'Hunger Games have been started!', ephemeral: true });
      }else{
        interaction.reply({ content: 'Hunger Games is already being played', ephemeral: true });
      }
    }
  });

  //challenge reaction completion start
  client.on('messageReactionAdd', async (messageReaction, user) => {
    if(user.id == clientId){
      return;
    }
    const config = require('./config.json');
    if(!config.isStarted){
      return;
    }
    cf = require('./challenges.json')
    pf = require('./players.json')

    playerIndex = -1;
    for(var i = 0 ; i < cf.challenges.length ; i++){
      if(cf.challenges[i].messageId == messageReaction.message.id){
        if(cf.challenges[i].isWaveBased){
          messageReaction.remove();
          return;
        }
        break;
      }
    }

    for(var i = 0 ; i < pf.players.length ; i++){
      if(pf.players[i].id == user.id){
        playerIndex = i;
      }
    }
    if(playerIndex == -1){
      for(var i = 0 ; i < cf.challenges.length ; i++){
        if(messageReaction.message.id == cf.challenges[i].messageId && messageReaction.emoji.name == '✅'){
          client.guilds.cache.get(guildId).channels.cache.get(botChannel).send(`${user} completed \'${cf.challenges[i].name}\' through reactions`);
          completeChallenge(user, cf.challenges[i].name, null, false, pf, cf);
          //calculateRoles(user)
          return;
        }
  }
    }
    for(var i = 0 ; i < cf.challenges.length ; i++){
      if(messageReaction.message.id == cf.challenges[i].messageId && messageReaction.emoji.name == '✅'){
        console.log('Reaction Add found');
        challengeAlreadyCompleted = false;
        for(var j = 0 ; j < pf.players[playerIndex].challenges.length ; j++){
          if(pf.players[playerIndex].challenges[j].name.toLowerCase() == cf.challenges[i].name.toLowerCase()){
            challengeAlreadyCompleted = true;
          }
        }
        if(!challengeAlreadyCompleted){
          client.guilds.cache.get(guildId).channels.cache.get(botChannel).send(`${user} completed \'${cf.challenges[i].name}\' through reactions`);
        }
        completeChallenge(user, cf.challenges[i].name, null, false, pf, cf);
      }
    }

    //calculateRoles(user)
  });

  client.on('messageReactionRemove', async (messageReaction, user) => {
    cf = require('./challenges.json')
    pf = require('./players.json')
    const config = require('./config.json');
    if(!config.isStarted){
      return;
    }

    playerIndex = -1;

    for(var i = 0 ; i < cf.challenges.length ; i++){
      if(cf.challenges[i].messageId == messageReaction.message.id){
        if(cf.challenges[i].isWaveBased){
          messageReaction.remove();
          return;
        }
        break;
      }
    }

    for(var i = 0 ; i < pf.players.length ; i++){
      if(pf.players[i].id == user.id){
        playerIndex = i;
      }
    }

    if(playerIndex == -1){
      for(var i = 0 ; i < cf.challenges.length ; i++){
        if(messageReaction.message.id == cf.challenges[i].messageId && messageReaction.emoji.name == '✅'){
          client.guilds.cache.get(guildId).channels.cache.get(botChannel).send(`${user} decompleted \'${cf.challenges[i].name}\' through reactions`);
          decompleteChallenge(user, cf.challenges[i].name, null, false, pf, cf);
          //calculateRoles(user)
          return;
        }
      }
    }

    for(var i = 0 ; i < cf.challenges.length ; i++){
      if(messageReaction.message.id == cf.challenges[i].messageId && messageReaction.emoji.name == '✅'){
        console.log('Reaction Remove found');
        challengeAlreadyCompleted = false;
        for(var j = 0 ; j < pf.players[playerIndex].challenges.length ; j++){
          if(pf.players[playerIndex].challenges[j].name.toLowerCase() == cf.challenges[i].name.toLowerCase()){
            challengeAlreadyCompleted = true;
          }
        }
        if(challengeAlreadyCompleted){
          client.guilds.cache.get(guildId).channels.cache.get(botChannel).send(`${user} decompleted \'${cf.challenges[i].name}\' through reactions`);
        }
        decompleteChallenge(user, cf.challenges[i].name, null, false, pf, cf);
      }
    }

    //calculateRoles(user)
  });
  //challenge reaction completion end

  client.login(token);

  async function getGuildMember(user){
    return client.guilds.cache.get('887891951465140256').members.fetch(user.id);
  }

  //Completes a challenge for a player
  function completeChallenge(player, challengeToComplete , interaction , shouldReply , pf , cf, wave){
    if(player.id == '923650944867119105'){
      if(!shouldReply){
        return;
      }
    }
    var challengeObj;
    for(var i = 0 ; i < cf.challenges.length ; i++){
      if(cf.challenges[i].name.toLowerCase() == challengeToComplete.toLowerCase() && cf.challenges[i].messageId > 0){
        if((wave == null && !cf.challenges[i].isWaveBased) || (wave != null && cf.challenges[i].isWaveBased)){
          challengeObj = cf.challenges[i]
        }
      }
    }
    if(challengeObj){
      var boolTemp2 = false;
      for(var i = 0 ; i < pf.players.length ; i++){
        if(pf.players[i].id == player.id){
          boolTemp2 = true;
          var boolTemp = false;
          var cIndex = -1;
          for(var j = 0 ; j < pf.players[i].challenges.length ; j++){
            if(pf.players[i].challenges[j].name.toLowerCase() == challengeToComplete.toLowerCase()){
              boolTemp = true;
              cIndex = j;
              break;
            }
          }

          if(boolTemp){
            if(challengeObj.isWaveBased){
              if(wave == null || wave < 0){
                wave = 0;
              }
              oldWave = pf.players[i].challenges[cIndex].waveReached;
              waveDif = wave - oldWave;
              pf.players[i].challenges[cIndex].waveReached = wave;
              pf.players[i].points += waveDif * challengeObj.points;
              fs.writeFile('./players.json', JSON.stringify(pf , null , 2) , err => {
                if (err) {
                  console.error(err)
                  return
                }
              })
              if(shouldReply)
                interaction.reply(`Challenge succesfully completed`);
            }else{
              if(shouldReply)
                interaction.reply(`${player.username} has already completed that challenge`);
            }
          }else{
            if(challengeObj.isWaveBased){
              if(wave == null || wave < 0){
                wave = 0;
              }
              challengeObj.waveReached = wave;
            }
            pf.players[i].challenges.push(challengeObj)
            pf.players[i].points += (challengeObj.isWaveBased)?(challengeObj.points * challengeObj.waveReached) : (challengeObj.points);
            fs.writeFile('./players.json', JSON.stringify(pf , null , 2) , err => {
              if (err) {
                console.error(err)
                return
              }
            })
            if(shouldReply)
              interaction.reply(`Challenge succesfully completed`);
          }
          break;
        }
      }
      if(!boolTemp2){
        var newObj;
        var challengeObj2 = {};
        challengeObj2.week = challengeObj.week;
        challengeObj2.name = challengeObj.name;
        challengeObj2.description = challengeObj.description;
        challengeObj2.rules = challengeObj.rules;
        challengeObj2.isWaveBased = challengeObj.isWaveBased;
        challengeObj2.points = challengeObj.points;
        challengeObj2.messageId = challengeObj.messageId;
        challengeObj2.channelId = challengeObj.channelId;
        if(challengeObj2.isWaveBased){
          if(wave == null || wave < 0){
            wave = 0;
          }
          challengeObj2.waveReached = wave;
          newObj = {
            id: player.id,
            points: challengeObj2.points * wave,
            challenges: [challengeObj2]
          }
        }else{
          newObj = {
            id: player.id,
            points: challengeObj2.points,
            challenges: [challengeObj2]
          }
        }
        pf.players.push(newObj)
        fs.writeFile('./players.json', JSON.stringify(pf , null , 2) , err => {
          if (err) {
            console.error(err)
            return
          }
        })
        if(shouldReply)
          interaction.reply(`Challenge succesfully completed`);
      }
    }else if(shouldReply){
      interaction.reply('That challenge doesn\'t exist, make sure the name is correct, including the player amount (If the challenge is wave based, use /completewaves, if not, use /completechallenge)')
    }
    //calculateRoles(player)
  }

  function decompleteChallenge(player, challengeToDecomplete, interaction, shouldReply , pf , cf){
    var challengeObj;
    for(var i = 0 ; i < cf.challenges.length ; i++){
      if(cf.challenges[i].name.toLowerCase() == challengeToDecomplete.toLowerCase()){
        challengeObj = cf.challenges[i]
      }
    }

    if(challengeObj){
      var bool1 = false;
      for(var i = 0 ; i < pf.players.length ; i++){
        if(pf.players[i].id == player.id){
          bool1 = true;
          var boolTemp = false;
          var index = -1;
          for(var j = 0 ; j < pf.players[i].challenges.length ; j++){
            if(pf.players[i].challenges[j].name.toLowerCase() == challengeToDecomplete.toLowerCase()){
              boolTemp = true;
              index = j;
            }
          }
          //console.log(`${interaction.user.username} used decompletechallenge (found a player)`);
          if(!boolTemp){
            if(shouldReply){
              interaction.reply(`${player.username} has not completed that challenge`);
            }
          }else{
            pf.players[i].points -= (challengeObj.isWaveBased)?(challengeObj.points * pf.players[i].challenges[index].waveReached):(challengeObj.points);
            pf.players[i].challenges.splice(index, 1)
            fs.writeFile('./players.json', JSON.stringify(pf , null , 2) , err => {
              if (err) {
                console.error(err)
                return
              }
            })
            if(shouldReply){
              interaction.reply(`Challenge succesfully decompleted`);
            }
          }
          break;
        }
      }
      if(!bool1){
        if(shouldReply){
          interaction.reply(`${player.username} has not completed that challenge`);
        }
      }
    }else{
      if(shouldReply){
        interaction.reply('That challenge doesn\'t exist');
      }
    }
    //calculateRoles(player)
  }

  function recalculatePoints(){
    const pf = require('./players.json')
    for(var i = 0 ; i < pf.players.length ; i++){
      pf.players[i].points = 0;
      for(var j = 0 ; j < pf.players[i].challenges.length ; j++){
        if(pf.players[i].challenges[j].isWaveBased){
          pf.players[i].points += pf.players[i].challenges[j].points * pf.players[i].challenges[j].waveReached;
        }else{
          pf.players[i].points += pf.players[i].challenges[j].points;
        }
      }
    }
    fs.writeFile('./players.json', JSON.stringify(pf , null , 2) , err => {
      if (err) {
        console.error(err)
        return
      }
    })
  }

  function sortChallenges(){
    const cf = require('./challenges.json')

    function compare(a,b){
      a1 = parseInt(a.name.charAt(0))
      b1 = parseInt(b.name.charAt(0))
      if(a.week != b.week){
        return a.week - b.week;
      }
      if(a1){
        if(b1){
          if(a1 < b1){
            return -1
          }
          if(b1 < a1){
            return 1
          }
          if(a.points < b.points){
            return -1
          }
          return 1
        }
        return -1
      }
      if(b1){
        return 1;
      }
      if(a.points < b.points){
        return -1
      }
      return 1
    }

    cf.challenges.sort(compare)
    fs.writeFile('./challenges.json', JSON.stringify(cf , null , 2) , err => {
      if (err) {
        console.error(err)
        return
      }
    })
  }

  function challToString(challenge){
    s = `**__CHALLENGE: "${challenge.name}"__**\n`;
    s += `Objective: **${challenge.description}**\n`;
    s += `Rules: **${challenge.rules}**\n`;
    if(challenge.isWaveBased){
      s += `*(This challenge awards points for every wave reached)*\n`
      s += `Points Per Wave: **${challenge.points}**\n`;
    }
    else {
      s += `Points: **${challenge.points}**\n`;
    }
    s += `Damage: **100%**\n`;
    if(challenge.isWaveBased){
      s += `*To complete this challenge, use /completewaves in <#${botChannel}>*\n`;
    }else{
      s += `*To complete this challenge, react to this message with a ✅ or use /completechallenge in <#${botChannel}>*\n`;
    }
    s += `**------------------------------------------------------**`;
    return s;

  }
