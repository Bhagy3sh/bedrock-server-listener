const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const bedrock = require('bedrock-protocol');

// Replace with your webhook URL
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1297609003123216524/ez0RnlIKJ9hC-PLLty7fUkCb1mkY7aeTR0q2sTqIaqXWgoAP2ON6RRwfYO5kNp8WuXL7';

// Minecraft bot options
const botOptions = {
  host: process.env.IP,
  port: process.env.PORT,
  username: process.env.USERNAME
};

// Discord bot client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
    // GatewayIntentBits.MessageContent
  ]
});

let mcBot;
let players = [];
client.on("ready", async () => {
  await sendWebhookMessage(`${client.user.tag} has awakened`);
  client.user.setActivity(`Joined the emos smp rn`);

  try {
    await client.application.commands.set([
      {
        name: 'start',
        description: 'Starting the program'
      },
      {
        name: 'close',
        description: 'Starting the program'
      },
      {
        name: 'say',
        description: 'Sends messages in chat',
        options: [
            {
                name: 'message',
                type: 3, //string
                description: 'Enter message to be sent in server',
                required: true
            }
        ]
      },
      {
        name: 'list',
        description: 'Shows list of active players in server'
      }
    ]);

    await sendWebhookMessage('Commands registered successfully.');
  } catch (error) {
    await sendWebhookMessage('Failed to register commands: ' + error.message);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'start') {
    try {
      await interaction.deferReply();
      await handleRecruitment(interaction);
    } catch (error) {
      await sendWebhookMessage('Failed to join ' + error.message);
      await interaction.editReply('Failed to handle recruitment.');
    }
  } else if (interaction.commandName === 'close') {
    await interaction.reply('Terminating the program...');
    await sendWebhookMessage('Terminating the program...');
    process.exit(0);
  }
  else if(interaction.commandName=='say'){
    const servMsg = interaction.options.getString('message');

    const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('Hachinaa')
    .setDescription(`Message sent succesfully`);

    await interaction.deferReply();
    await interaction.followUp({ embeds: [embed] });
    await mcBot.queue('text', {
        type: 'chat',
        needs_translation: false,
        source_name: mcBot.options.username,
        xuid: '',
        platform_chat_id: '',
        message: servMsg
      });
  }
  else if(!interaction.isCommand())return;

  else if (interaction.commandName === 'list') {
    if (players.length === 0) {
      await interaction.reply('No players currently online.');
    } else {
      // Create an embed
      const embed = new EmbedBuilder()
        .setTitle('Online Players')
        .setDescription('Here is a list of players currently online:')
        .setColor(0x00FF00) // Green color for embed

      // Add player details to the embed
      players.forEach(player => {
        embed.addFields({
          name: player.name,
          value: `Platform: ${player.platform}`,
          inline: false
        });
      });

      // Reply with the embed
      await interaction.reply({ embeds: [embed] });
    }
  }
});

async function handleRecruitment(interaction) {
  await sendWebhookMessage('Starting recruitment process...');

  mcBot = bedrock.createClient(botOptions);

  mcBot.on('connect', () => {
    sendWebhookMessage('Connected to the server');
  });

  mcBot.on('disconnect', (packet) => {
    sendWebhookMessage('Disconnected from the server: ' + JSON.stringify(packet));
  });

  mcBot.on('error', (error) => {
    sendWebhookMessage('An error occurred: ' + error.message);
  });

  mcBot.on('text', (packet) => {
    sendWebhookMessage(`Text message received: ${packet.message}`);
  });

  mcBot.on('end', () => {
    sendWebhookMessage('Connection to server has ended.');
  });

  mcBot.on("player_list", (packet) => {
    if (packet.records && packet.records.records && packet.records.records.length > 0) {
      if (packet.records.type === "add") {
        for (const playerRecord of packet.records.records) {
          const id = playerRecord.build_platform;
          const username = playerRecord.username;
          const devices = {
            "0": "Undefined",
            "1": "Android",
            "2": "iPhone",
            "3": "Mac PC",
            "4": "Amazon Fire",
            "5": "Oculus Gear VR",
            "6": "Hololens VR",
            "7": "Windows PC 64",
            "8": "Windows PC 32",
            "9": "Dedicated Server",
            "10": "T.V OS",
            "11": "PlayStation",
            "12": "Nintendo Switch",
            "13": "Xbox One",
            "14": "WindowsPhone",
            "15": "Linux"
          };

          const existingPlayerIndex = players.findIndex((x) => x.uuid === playerRecord.uuid);
          if (existingPlayerIndex === -1) {
            players.push({
              name: username,
              uuid: playerRecord.uuid,
              platform: devices[id]
            });
            console.log(`\nPlayer Joined: ${username}\nUsing: ${devices[id]}\nTotal Players: ${players.length}`);
          }
        }
      } else if (packet.records.type === "remove") {
        for (const playerRecord of packet.records.records) {
          const index = players.findIndex((x) => x.uuid === playerRecord.uuid);
          const removedPlayer = players.splice(index, 1)[0];
          console.log(`\nPlayer left: ${removedPlayer.name}\nTotal Players: ${players.length}`);
        }
      }
    }
  });

  mcBot.connect();
}

async function sendWebhookMessage(message) {
  try {
    await axios.post(WEBHOOK_URL, {
      content: message
    });
  } catch (error) {
    console.error('Failed to send webhook message:', error.message);
  }
}
client.login(process.env.TOKEN).catch(err => {
  console.error('Failed to login:', err);
});
