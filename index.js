const express = require('express');
const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

// 1. Keep-alive web server for Render
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot service active.'));
app.listen(PORT, () => console.log(`Web server listening on port ${PORT}`));

// 2. Direct connection options (Using direct IP + dynamic port)
const BOT_OPTIONS = {
  host: '185.107.192.140', // Direct IP of your Aternos node
  port: 53449,             // Current dynamic port
  username: 'ScoutBot',
  version: '1.21.1',
  auth: 'offline'          // Explicitly tell mineflayer not to wait for Microsoft auth
};

let bot;

function createBot() {
  console.log(`[BOT] Initiating connection to ${BOT_OPTIONS.host}:${BOT_OPTIONS.port}...`);
  
  bot = mineflayer.createBot(BOT_OPTIONS);

  bot.on('login', () => {
    console.log('[BOT] Successfully logged in to server protocol!');
  });

  bot.on('spawn', () => {
    console.log('[BOT] SPAWNED in world! Ready and moving.');

    try {
      bot.loadPlugin(pathfinder);
      const mcData = require('minecraft-data')(bot.version);
      const defaultMove = new Movements(bot, mcData);
      defaultMove.canDig = false;
      defaultMove.allowParkour = true;
      bot.pathfinder.setMovements(defaultMove);
    } catch (e) {
      console.log('[PATHFINDER ERROR]', e.message);
    }

    // OP commands
    setTimeout(() => {
      bot.chat('/effect give @s minecraft:resistance 99999 5 true');
      bot.chat('/effect give @s minecraft:saturation 99999 5 true');
      bot.chat('/effect give @s minecraft:regeneration 99999 5 true');
      bot.chat('/feed');
      bot.chat('/heal');
    }, 3000);

    // Natural wander & glance
    setInterval(() => {
      if (!bot.entity) return;
      const yaw = (Math.random() - 0.5) * Math.PI * 2;
      const pitch = (Math.random() - 0.5) * 0.6;
      bot.look(yaw, pitch, false);
    }, 5000);

    setInterval(() => {
      if (!bot.entity || (bot.pathfinder && bot.pathfinder.isMoving())) return;
      const pos = bot.entity.position;
      const targetX = pos.x + (Math.random() - 0.5) * 20;
      const targetZ = pos.z + (Math.random() - 0.5) * 20;

      if (Math.random() < 0.3) {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 350);
      }

      if (bot.pathfinder) {
        bot.pathfinder.setGoal(new goals.GoalNear(targetX, pos.y, targetZ, 2));
      }
    }, 8000);
  });

  bot.on('kicked', (reason) => {
    console.log('[KICKED by server]:', JSON.stringify(reason));
  });

  bot.on('error', (err) => {
    console.error('[ERROR encountered]:', err.message);
  });

  bot.on('end', (reason) => {
    console.log(`[DISCONNECTED]: ${reason}. Reconnecting in 15 seconds...`);
    setTimeout(createBot, 15000);
  });
}

createBot();
