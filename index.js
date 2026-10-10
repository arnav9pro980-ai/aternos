const express = require('express');
const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

// 1. Web server to keep Render web services active
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Minecraft bot is alive and running.');
});

app.listen(PORT, () => {
  console.log(`Keep-alive web server listening on port ${PORT}`);
});

// 2. Bot configuration
const BOT_OPTIONS = {
  host: 'MARVELSMPHILLS-Gx3t.aternos.me',
  username: process.env.BOT_NAME || 'ScoutBot',
  version: false // Auto-detect server version
};

let bot;

function createBot() {
  console.log(`Connecting bot to ${BOT_OPTIONS.host}...`);
  bot = mineflayer.createBot(BOT_OPTIONS);

  bot.loadPlugin(pathfinder);

  bot.once('spawn', () => {
    console.log(`${bot.username} spawned in the world.`);

    const mcData = require('minecraft-data')(bot.version);
    const defaultMove = new Movements(bot, mcData);
    defaultMove.canDig = false; // Don't break blocks while pathfinding
    defaultMove.allowParkour = true; // Allows jumping across 1-block gaps
    bot.pathfinder.setMovements(defaultMove);

    // Apply OP buffs (resistance, saturation/food, regeneration)
    setTimeout(() => {
      bot.chat('/effect give @s minecraft:resistance 99999 5 true');
      bot.chat('/effect give @s minecraft:saturation 99999 5 true');
      bot.chat('/effect give @s minecraft:regeneration 99999 5 true');
      bot.chat('/feed');
      bot.chat('/heal');
    }, 3000);

    // Start natural wandering and head turning
    startWandering();
    startHeadMovement();
  });

  // Natural head movements (glancing around)
  function startHeadMovement() {
    setInterval(() => {
      if (!bot.entity) return;
      // Random yaw (-pi to pi) and subtle pitch (-0.3 to 0.3)
      const yaw = (Math.random() - 0.5) * Math.PI * 2;
      const pitch = (Math.random() - 0.5) * 0.6;
      bot.look(yaw, pitch, false);
    }, 4000 + Math.random() * 3000);
  }

  // Wandering routine
  function startWandering() {
    setInterval(() => {
      if (!bot.entity || bot.pathfinder.isMoving()) return;

      const currentPos = bot.entity.position;
      // Wander within a 15-block radius
      const targetX = currentPos.x + (Math.random() - 0.5) * 30;
      const targetZ = currentPos.z + (Math.random() - 0.5) * 30;

      // Small chance to jump playfully before moving
      if (Math.random() < 0.25) {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 400);
      }

      bot.pathfinder.setGoal(new goals.GoalNear(targetX, currentPos.y, targetZ, 2));
    }, 8000);
  }

  // Error and disconnect handling
  bot.on('kicked', (reason) => {
    console.log(`Bot kicked: ${reason}`);
  });

  bot.on('error', (err) => {
    console.error(`Bot encountered an error:`, err);
  });

  bot.on('end', () => {
    console.log('Bot disconnected. Reconnecting in 25 seconds...');
    setTimeout(createBot, 25000);
  });
}

createBot();
