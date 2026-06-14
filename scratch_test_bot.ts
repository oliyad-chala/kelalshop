import { bot } from './lib/telegram/admin/bot';
import './lib/telegram/admin/commands';

async function testCommand(command: string) {
  console.log(`Testing /${command}...`);
  try {
    const update = {
      update_id: 1,
      message: {
        message_id: 1,
        from: { id: 12345, is_bot: false, first_name: 'TestAdmin' },
        chat: { id: 12345, type: 'private' },
        date: Math.floor(Date.now() / 1000),
        text: `/${command}`,
        entities: [{ offset: 0, length: command.length + 1, type: 'bot_command' }]
      }
    };
    
    // We mock ctx.reply to see what the bot would say
    // We can't easily mock the internal context without overriding the bot's api methods
    // So let's mock the grammy API object globally.
    // Wait, let's just use bot.handleUpdate(update) and mock the outbound HTTP requests
  } catch(e) {
    console.error(e);
  }
}

// Actually let's just make sure there are no runtime syntax errors loading the bot
console.log('Bot imported successfully.');
process.exit(0);
