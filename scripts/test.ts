import { bot } from '../lib/telegram/admin/bot';
import '../lib/telegram/admin/commands';

async function run() {
  try {
    await bot.handleUpdate({
      update_id: 1,
      message: {
        message_id: 1,
        date: Math.floor(Date.now() / 1000),
        chat: { id: 8983715450, type: 'private', first_name: 'Admin' },
        from: { id: 8983715450, is_bot: false, first_name: 'Admin' },
        text: '/start'
      }
    });
    console.log('Update processed successfully');
  } catch (err) {
    console.error('Error processing update:', err);
  }
}

run();
