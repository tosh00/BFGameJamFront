import { Application, Assets, Graphics, Sprite, Texture } from 'pixi.js';
import { asset, getButtonPositions } from './utils/utils';
import { loadAllBackgrounds, getRandomBackground, Difficulty } from './utils/loadAssets';
import Character from './character';
import Portal from './portal';
import Terminal from './terminal';
import Menu from './menu';
import gameState from './gameState';
import { PortalDifficulty } from './apiConnections/types';

// Default bet amount
const DEFAULT_BET = 10;

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ resizeTo: window });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  // Load textures
  await Assets.load([
    'https://pixijs.com/assets/bg_button.jpg',
    'https://pixijs.com/assets/button.png',
    'https://pixijs.com/assets/button_down.png',
    asset('portal_big'),
    asset('backgrounds/village'),
    asset('platform'),
    asset('Cindy'),
    asset('Cindy2'),
    asset('Cindy3'),
  ]);

  // Load all background assets by difficulty
  await loadAllBackgrounds();

  // Portal difficulties mapping (index 0 = easy, 1 = medium, 2 = hard)
  const portalDifficulties: Difficulty[] = ['easy', 'medium', 'hard'];
  
  // Map difficulty to API enum
  const difficultyToApi: Record<Difficulty, PortalDifficulty> = {
    'easy': PortalDifficulty.EASY,
    'medium': PortalDifficulty.MEDIUM,
    'hard': PortalDifficulty.HARD,
  };

  // Create a background with a random easy background initially
  const initialBackground = 'https://raw.githubusercontent.com/tosh00/BFGameJamFrontAssets/refs/heads/main/backgrounds/village.png';
  const background = Sprite.from(initialBackground);

  const backgroundBottomOffset = 200;

  // background.width = app.screen.width;
  background.height = app.screen.height - backgroundBottomOffset;

  // Add background to stage...
  app.stage.addChild(background);

  // Create some textures from an image path
  const textureButton = Texture.from(asset('portal_big'));
  const portalScale = 0.9;
  const buttons: Portal[] = [];

  const buttonPositions = getButtonPositions(3, app.screen.width, textureButton.width, portalScale, 0.05);

  const characterScene = new Character();
  characterScene.render(app, backgroundBottomOffset);
  app.stage.addChild(characterScene.scene);

  interface ButtonSprite extends Sprite {
    isdown?: boolean;
    isOver?: boolean;
  }
  
  // Track if portals are clickable (prevent double-clicks during animations)
  let portalsEnabled = true;
  
  for (let i = 0; i < buttonPositions.length; i++) {
    const difficulty = portalDifficulties[i];
    const initialBgUrl = getRandomBackground(difficulty);
    const b = new Portal(
      buttonPositions[i],
      difficulty,
      initialBgUrl,
      (B) => {
        if (portalsEnabled) {
          handlePortalClick(i);
        }
      },
      () => {},
      () => {
        console.log('over');
      },
      () => {}
    );
    b.render(app);
    b.addAnimations(app);
    buttons.push(b);
    app.stage.addChild(b.scene);
  }

  /**
   * Handle portal click - either start new round or continue existing one
   */
  async function handlePortalClick(portalIndex: number) {
    const clickedPortal = buttons[portalIndex];
    const difficulty = clickedPortal.difficulty;
    const apiDifficulty = difficultyToApi[difficulty];
    const portalBackgroundUrl = clickedPortal.getBackgroundUrl();
    
    console.log('Portal clicked! Difficulty:', difficulty);
    
    // Disable portals during API call and animation
    portalsEnabled = false;
    
    // Check if we have an active round (continue) or need to start new one
    const hasActiveRound = gameState.hasActiveRound();
    
    let result;
    
    if (hasActiveRound) {
      // Continue existing round
      terminal.setText('Continuing your journey...');
      result = await gameState.continueRound();
    } else {
      // Start new round
      const state = gameState.getState();
      if (!gameState.canAffordBet(DEFAULT_BET)) {
        terminal.setText(`Not enough gold! Need ${DEFAULT_BET} to enter.`);
        portalsEnabled = true;
        return;
      }
      
      terminal.setText(`Entering ${difficulty} portal...`);
      result = await gameState.startRound(apiDifficulty, DEFAULT_BET);
    }
    
    if (!result.success) {
      terminal.setText(`Error: ${result.error}`);
      portalsEnabled = true;
      return;
    }
    
    // Start the jump animation
    characterScene.jump(app, backgroundBottomOffset, 100);

    // After jump animation - hide portals and change background at the same time
    setTimeout(() => {
      // Hide all portals instantly
      buttons.forEach((portal) => {
        portal.hide(0);
      });
      
      // Change main background
      background.texture = Texture.from(portalBackgroundUrl);
      
      // Update UI based on result
      updateTerminalWithResult(result);
      
      // After a few seconds, reveal portals with new backgrounds
      setTimeout(() => {
        buttons.forEach((portal, index) => {
          const newBgUrl = getRandomBackground(portalDifficulties[index]);
          portal.setBackground(newBgUrl);
          
          // Stagger the reveal animation
          setTimeout(() => {
            portal.reveal(500);
          }, index * 150);
        });
        
        // Re-enable portals after reveal animation
        setTimeout(() => {
          portalsEnabled = true;
        }, buttons.length * 150 + 500);
        
      }, 2000); // Wait 2 seconds before revealing portals
      
    }, 1000); // Wait for jump animation
  }

  /**
   * Update terminal display based on round result
   */
  function updateTerminalWithResult(result: {
    success: boolean;
    isWin: boolean;
    reward: number;
    message: string;
    roundStatus?: string;
    totalLost?: number;
  }) {
    const state = gameState.getState();
    const round = state.activeRound;
    
    if (result.isWin) {
      // Win - show accumulated winnings and options
      const eventNum = round?.events?.length || 1;
      const accumulated = round?.accumulatedWinnings || result.reward;
      const multiplier = round?.currentMultiplier?.toFixed(2) || '1.00';
      const nextDifficulty = round?.nextEventDifficulty || 0;
      
      let text = `🎉 EVENT ${eventNum}: WIN!\n`;
      text += `+${result.reward} gold this event\n`;
      text += `Total accumulated: ${accumulated} gold (${multiplier}x)\n\n`;
      text += `💰 Balance: ${state.balance} gold\n\n`;
      
      if (state.canContinue) {
        text += `⚠️ RISK IT? Next portal: ${nextDifficulty}% fail chance\n`;
        text += `Choose a portal to CONTINUE or CASH OUT!`;
      }
      
      terminal.setText(text);
      
      // Show Cash Out button if possible
      terminal.showCashOutButton(state.canCashOut, accumulated);
      
    } else {
      // Loss - show what was lost
      let text = `💀 DEFEAT!\n`;
      text += `${result.message}\n\n`;
      
      if (result.totalLost) {
        text += `Lost: ${result.totalLost} gold\n`;
      }
      
      text += `💰 Balance: ${state.balance} gold\n\n`;
      text += `Choose a portal to try again!`;
      
      terminal.setText(text);
      
      // Hide Cash Out button
      terminal.showCashOutButton(false);
    }
  }

  /**
   * Handle Cash Out action
   */
  async function handleCashOut() {
    portalsEnabled = false;
    terminal.setText('Cashing out...');
    
    const result = await gameState.cashOut();
    
    if (result.success) {
      const state = gameState.getState();
      let text = `💰 CASHED OUT!\n`;
      text += `Won: ${result.totalWinnings} gold\n`;
      text += `${result.message}\n\n`;
      text += `💰 Balance: ${state.balance} gold\n\n`;
      text += `Choose a portal to start a new round!`;
      
      terminal.setText(text);
      terminal.showCashOutButton(false);
    } else {
      terminal.setText(`Error cashing out: ${result.error}`);
    }
    
    portalsEnabled = true;
  }

  //  terminal UI

  const terminal = new Terminal(backgroundBottomOffset, app.screen.height, app.screen.width);
  terminal.render(app);
  
  // Set up Cash Out callback
  terminal.setCashOutCallback(handleCashOut);
  
  app.stage.addChild(terminal.scene);

  app.ticker.add(() => {
    // Update terminal typewriter effect
    terminal.update();
  });

  // Starting menu
  const menu = new Menu(app.screen.width, app.screen.height, () => {
    menu.destroy();
    // Game is now visible and playable - show balance and portal info
    updateTerminalInfo();
  });
  app.stage.addChild(menu.scene);

  // Portal chances based on difficulty
  const portalInfo = {
    EASY: { name: 'Easy', chance: '80%', rtp: '96%' },
    MEDIUM: { name: 'Medium', chance: '50%', rtp: '94%' },
    HARD: { name: 'Hard', chance: '25%', rtp: '92%' },
  };

  function updateTerminalInfo() {
    const state = gameState.getState();
    const balance = state.balance;
    const infoText =
      `💰 Balance: ${balance} gold | Bet: ${DEFAULT_BET} gold\n\n` +
      `Choose a Portal:\n` +
      `[🟢 EASY: ${portalInfo.EASY.chance} win, 1.2x reward]\n` +
      `[🟡 MEDIUM: ${portalInfo.MEDIUM.chance} win, 2x reward]\n` +
      `[🔴 HARD: ${portalInfo.HARD.chance} win, 4x reward]\n\n` +
      `Win to accumulate rewards - CASH OUT or risk it all!`;
    terminal.setText(infoText);
  }
  
  // Subscribe to game state changes to update UI
  gameState.subscribe((state) => {
    // Update cash out button visibility based on state
    if (state.canCashOut && state.activeRound) {
      terminal.showCashOutButton(true, state.activeRound.accumulatedWinnings);
    } else if (!state.canCashOut) {
      terminal.showCashOutButton(false);
    }
  });
})();
