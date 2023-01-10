const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = require('./config.json');

const commands = [
	/*new SlashCommandBuilder()
    .setName('addchallenge')
    .setDescription('Adds a challenge to the challenge list')
		//.setDefaultPermission(false)
    .addStringOption(option =>
      option.setName(`challenge_name`)
        .setDescription(`The name of the challenge`)
        .setRequired(true))
    .addNumberOption(option =>
      option.setName(`points`)
        .setDescription(`Points given for completing a challenge`)
        .setRequired(true))
		.addStringOption(option =>
			option.setName('challenge_type')
				.setDescription('How many players is the challenge for')
				.addChoice('1p' , '914314515695427634')
				.addChoice('2p' , '914314578442203176')
				.addChoice('3p' , '914314612449636433')
				.addChoice('4p' , '914314656775032864')
				.addChoice('speedrun' , '924815892141994015')
				.addChoice('requirement' , '931568713533100083')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('messageid')
				.setDescription('The message id of the challenge description')
				.setRequired(true)
				//.setRequired(false)
			)
				,*/
	/*new SlashCommandBuilder()
		.setName('listchallenges')
		.setDescription('Lists every challenge')
		.addStringOption(option =>
      option.setName(`filter`)
        .setDescription(`Filters the challenges by a prefix`)
        .setRequired(false)) ,*/
	new SlashCommandBuilder()
		.setName('completechallenge')
		.setDescription('Completes a challenge for someone')
		.addUserOption(option =>
      option.setName(`player`)
        .setDescription(`Person who completed the challenge`)
        .setRequired(true))
		.addStringOption(option =>
      option.setName(`challenge_name`)
        .setDescription(`Name of the challenge completed`)
        .setRequired(true)) ,
	new SlashCommandBuilder()
		.setName('decompletechallenge')
		.setDescription('Decompletes a challenge for someone')
		.addUserOption(option =>
      option.setName(`player`)
        .setDescription(`Person who decompleted the challenge`)
        .setRequired(true))
		.addStringOption(option =>
      option.setName(`challenge_name`)
        .setDescription(`Name of the challenge decompleted`)
        .setRequired(true)) ,
	new SlashCommandBuilder()
		.setName('playerstats')
		.setDescription('Lists the stats of a player')
		.addUserOption(option =>
      option.setName(`player`)
        .setDescription(`Person to check the stats of`)
        .setRequired(false))
		.addStringOption(option =>
      option.setName(`filter`)
        .setDescription(`Filters the challenges by a prefix`)
        .setRequired(false)
				.addChoice('1p' , '1p')
				.addChoice('2p' , '2p')
				.addChoice('3p' , '3p')
				.addChoice('4p' , '4p')
				.addChoice('speedrun' , 'speedrun'))
		.addStringOption(option =>
      option.setName(`show_completed`)
        .setDescription(`Show completed challenges or not`)
        .setRequired(false)
				.addChoice('Show' , 'true')
				.addChoice('Don\'t Show' , 'false'))
		 ,
	new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('Shows the leaderboard')
		.addNumberOption(option =>
      option.setName(`page`)
        .setDescription(`Which page to show (20 people per page) (Enter 0 for the full leaderboard)`)
        .setRequired(false)) ,
	new SlashCommandBuilder()
		.setName('completewaves')
		.setDescription('Completes all the challenges up to a given wave')
		.addUserOption(option =>
      option.setName(`player`)
        .setDescription(`Person who completed the challenge`)
        .setRequired(true))
		.addStringOption(option =>
      option.setName(`challenge_name`)
        .setDescription(`The name of the challenge (player amount included in the beginning)`)
        .setRequired(true))
		.addNumberOption(option =>
      option.setName(`wave`)
        .setDescription(`The highest wave obtained in a challenge`)
        .setRequired(true)) ,
	new SlashCommandBuilder()
		.setName('editchallenge')
		.setDescription('Edits the points given of a challenge')
		.setDefaultPermission(false)
		.addStringOption(option =>
			option.setName(`challenge_name`)
				.setDescription(`The name of the challenge (player amount included in the beginning)`)
				.setRequired(true))
		.addStringOption(option =>
			option.setName(`new_name`)
				.setDescription(`The optional new name of the challenge`)
				.setRequired(false))
		.addNumberOption(option =>
			option.setName(`points`)
				.setDescription(`Points given for completing a challenge`)
				.setRequired(false))
		.addStringOption(option =>
			option.setName(`description`)
				.setDescription(`The optional new decription of the challenge`)
				.setRequired(false))
		.addStringOption(option =>
			option.setName(`rules`)
				.setDescription(`The optional new rules of the challenge`)
				.setRequired(false)) ,
	new SlashCommandBuilder()
		.setName('starthungergames')
		.setDescription('Starts the hunger games')
		.setDefaultPermission(false) ,
	new SlashCommandBuilder()
		.setName('challengestats')
		.setDescription('Lists the stats of a challenge')
		//.setDefaultPermission(true)
		.addStringOption(option =>
			option.setName(`challenge_name`)
				.setDescription(`Name of the challenge`)
				.setRequired(true)) ,
]
	.map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);
