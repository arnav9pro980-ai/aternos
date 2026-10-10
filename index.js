const express = require('express');
const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

// 1. Keep-alive web server for Render
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Minecraft bot is alive and running.');
});

app.listen(PORT, () => {
  console.log(`Web server listening on port ${PORT}`);
});

// 2. Bot configuration
const BOT_OPTIONS = {
  host: 'MARVELSMPHILLS-Gx3t.aternos.me',
  port: 53449,        // <--- Add this exact port
  version: '1.21.1',  // <--- Set explicit version matching your server
  username: 'dudetnthehe'
};



let bot;

function createBot() {
  console.log(`Connecting bot to ${BOT_OPTIONS.host}...`);
  bot = mineflayer.createBot(BOT_OPTIONS);

  bot.loadPlugin(pathfinder);

  bot.once('spawn', () => {
    console.log(`${bot.username} spawned in the world.`);

    try {
      const mcData = require('minecraft-data')(bot.version);
      const defaultMove = new Movements(bot, mcData);
      defaultMove.canDig = false;
      defaultMove.allowParkour = true;
      bot.pathfinder.setMovements(defaultMove);
    } catch (e) {
      console.log('Pathfinder setup note:', e.message);
    }

    // Apply OP commands / buffs
    setTimeout(() => {
      bot.chat('/effect give @s minecraft:resistance 99999 5 true');
      bot.chat('/effect give @s minecraft:saturation 99999 5 true');
      bot.chat('/effect give @s minecraft:regeneration 99999 5 true');
      bot.chat('/feed');
      bot.chat('/heal');
    }, 3000);

    startWandering();
    startHeadMovement();
  });

  function startHeadMovement() {
    setInterval(() => {
      if (!bot.entity) return;
      const yaw = (Math.random() - 0.5) * Math.PI * 2;
      const pitch = (Math.random() - 0.5) * 0.6;
      bot.look(yaw, pitch, false);
    }, 4000 + Math.random() * 3000);
  }

  function startWandering() {
    setInterval(() => {
      if (!bot.entity || (bot.pathfinder && bot.pathfinder.isMoving())) return;

      const currentPos = bot.entity.position;
      const targetX = currentPos.x + (Math.random() - 0.5) * 24;
      const targetZ = currentPos.z + (Math.random() - 0.5) * 24;

      if (Math.random() < 0.25) {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 350);
      }

      if (bot.pathfinder) {
        bot.pathfinder.setGoal(new goals.GoalNear(targetX, currentPos.y, targetZ, 2));
      }
    }, 7000);
  }

  bot.on('kicked', (reason) => console.log(`Kicked: ${reason}`));
  bot.on('error', (err) => console.error(`Error:`, err));
  bot.on('end', () => {
    console.log('Disconnected. Retrying in 25s...');
    setTimeout(createBot, 25000);
  });
}

createBot();
