import * as Discord from "discord.js";
import { keepAlive } from "./server";
import { CoCoModule } from "./interfaces";
import HelpModule from "./modules/help";
import InfoModule from "./modules/info";
import reactionRoleModule from "./modules/reaction-role";
import StonksModule from "./modules/stonks";
import ProfileModule from "./modules/profile";
import PointsModule from "./modules/points";
import { run } from './instagram/instagram';
import { startJob } from './timed_messages/newyear';
import { testing } from "googleapis/build/src/apis/testing";

// Configuration
require('dotenv').config();
const token = process.env.TOKEN;
const prefix = process.env.PREFIX || 'coco-';

// Defining bot
const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS
  ],
  partials: [
    'MESSAGE',
    'CHANNEL',
    'REACTION'
  ],
});

// Creating collection of command modules
let modules: Discord.Collection<string, CoCoModule> = new Discord.Collection();
InitializeModule(HelpModule);
InitializeModule(InfoModule);
InitializeModule(reactionRoleModule);
InitializeModule(StonksModule);
InitializeModule(ProfileModule);
InitializeModule(PointsModule);

// Bot start
client.on('ready', () => {
  client.user?.setActivity("with people", { type: "PLAYING" });
  console.log('CoCo is online.');
});

// Message handling
const sendWelcomeMessage = (message: any) => {
  let rulesChannelId = "897566470387671092";
  let ran = Math.floor((Math.random() * 10) + 1);
    if (ran === 1)
      message.channel.send(`I lost my life savings from dogecoin now go read <#${rulesChannelId}>`);
    else if (ran === 2)
      message.channel.send(`I bet you won't read <#${rulesChannelId}>`);
    else if (ran === 3)
      message.channel.send(`Read <#${rulesChannelId}> if you want rough brain`);
};

const deleteMessagesInWrongChannel = async(message: any, botCommandChannelId: string) => {
  let botMessageId: string;
  let userCommandMessageId = message.id;
  message.channel.send(`Go to <#${botCommandChannelId}>. Both messages will be deleted in 15 seconds.`)
      .then((msg: any) => {
        botMessageId = msg.id;
      });
    
    setTimeout(async() => {
      if (message.channel.type !== "DM" && botMessageId !== null && userCommandMessageId !== null) {
        await message.channel.messages.delete(userCommandMessageId);
        await message.channel.messages.delete(botMessageId);
      }
    }, 15000);
};

client.on('messageCreate', async message => {

  // Skip if message from bot
  if (message.author.bot)
    return;
  
  // Welcome channel is undefined when not found
  let welcomeChannel = message.guild?.channels.cache.find(c => c.name === 'welcome');
  if (welcomeChannel && message.channelId === welcomeChannel.id) {
    sendWelcomeMessage(message);
  }

  if (!message.content.startsWith(prefix))
    return;

  const args = message.content.slice(prefix.length).split(/ +/);
  const command = args.shift()?.toLowerCase();

  if (!command) return;

  // Get the command by name in the collection
  let commandHandler = modules.get(command);
  // Abort when the command is undefined
  if (!commandHandler) return;
  
  // Restrict command access
  let botCommandChannelId = '897596222255300658';
  let testingChannelId = '897596353897721907';
  if (message.channelId !== botCommandChannelId && message.channelId !== testingChannelId) {
    await deleteMessagesInWrongChannel(message, botCommandChannelId);
    return;
  }
  // All commands use this interface
  if (commandHandler.command) commandHandler.command(message, args, client, modules);
});

const sendDeletedMessage = async (message: any) => {
  let trackingChannelId = '967560432732766280';
  await message.guild.channels.fetch(trackingChannelId)
      .then((channel: any) => {
        const embed = new Discord.MessageEmbed();
        embed.setTitle(`Deleted Message`);
        embed.setDescription(`<#${message?.channel?.id}>`);
        embed.addField('Content', `${message?.content}`);
        embed.addField('Author Information', `name: ${message?.author?.username}\ntag: ${message?.author?.tag}\nid: ${message?.author?.id}`);
        embed.setColor('#2F4562');
        embed.setTimestamp();

        channel.send({
          embeds: [embed]
        });
        
        if (message.attachments.size > 0) {
          channel.send(`__Attachments Deleted__`);
          message.attachments.forEach((attachment: any) => {
              const link = attachment.url;
              channel.send({ 
                files: [link] 
              });
          });
        }
      });
};

client.on("messageDelete", async (message) => {
    if(!message.guild) 
        return;

    await sendDeletedMessage(message);
});

const sendEditedMessage = async (oldMessage: any, newMessage: any) => {
  let trackingChannelId = '967560432732766280';
  await oldMessage.guild.channels.fetch(trackingChannelId)
        .then((channel: any) => {
            const embed = new Discord.MessageEmbed();
            embed.setTitle(`Edited Message`);
            embed.setDescription(`<#${oldMessage?.channel?.id}>`);
            embed.addField('Old Content', `${oldMessage?.content}`);
            embed.addField('New Content', `${newMessage?.content}`);
            embed.addField('Author Information', `name: ${oldMessage?.author?.username}\ntag: ${oldMessage?.author?.tag}\nid: ${oldMessage?.author?.id}`);
            embed.setColor('#2F4562');
            embed.setTimestamp();
            
            channel.send({
                embeds: [embed]
            });
        });
}

client.on("messageUpdate", async (oldMessage, newMessage) => {
    if(!oldMessage.guild)
        return;

    await sendEditedMessage(oldMessage, newMessage);
}); 

// Host server
keepAlive();

// Login with token
client.login(token)/* .catch(() => {
  
});
 */
function InitializeModule(module: CoCoModule) {
  modules.set(module.name, module);
  if (module.service) module.service(client);
}

// Instagram Post Webhook
run();

// Sends New Year Message
startJob(client);

