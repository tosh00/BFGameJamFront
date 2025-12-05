import { Application, Assets, Sprite, Texture } from 'pixi.js';
import { asset, getButtonPositions } from './utils/utils';
import { loadAllBackgrounds, getRandomBackground, Difficulty } from './utils/loadAssets';
import Character from './character';
import Portal from './portal';
import Terminal from './terminal';
import Menu from './menu';
import DeathScreen from './deathScreen';
import gameState from './gameState';
import { PortalDifficulty } from './apiConnections/types';

// Current bet amount (set from menu selection)
let currentBetAmount = 10;

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

  // Initialize or restore session from localStorage BEFORE showing menu
  console.log('🎮 Initializing game session...');
  const sessionReady = await gameState.initOrRestoreSession();
  
  if (!sessionReady) {
    console.error('❌ Failed to initialize session');
    // Show error to user - you could add an error screen here
  }

  // Portal difficulties mapping (index 0 = easy, 1 = medium, 2 = hard)
  const portalDifficulties: Difficulty[] = ['easy', 'medium', 'hard'];

  // Map difficulty to API enum
  const difficultyToApi: Record<Difficulty, PortalDifficulty> = {
    easy: PortalDifficulty.EASY,
    medium: PortalDifficulty.MEDIUM,
    hard: PortalDifficulty.HARD,
  };

  // Portal info - chances, multipliers, world names
  const portalInfo: Record<Difficulty, { name: string; worldName: string; chance: string; multiplier: string; color: string }> = {
    easy: { name: 'Easy', worldName: 'Peaceful Meadows', chance: '80%', multiplier: '1.2x', color: '' },
    medium: { name: 'Medium', worldName: 'Mystic Forest', chance: '50%', multiplier: '2x', color: '' },
    hard: { name: 'Hard', worldName: 'Dragon\'s Lair', chance: '25%', multiplier: '4x', color: '' },
  };

  // Create a background with a random easy background initially
  const initialBackground =
    'https://raw.githubusercontent.com/tosh00/BFGameJamFrontAssets/refs/heads/main/backgrounds/village.png';
  const background = Sprite.from(initialBackground);

  const backgroundBottomOffset = 200;

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

  // Track if portals are clickable (prevent double-clicks during animations)
  let portalsEnabled = true;
  
  // Currently selected portal index (-1 = none selected)
  let selectedPortalIndex: number = -1;

  //  terminal UI (create early so we can reference it)
  const terminal = new Terminal(backgroundBottomOffset, app.screen.height, app.screen.width);
  terminal.render(app);
  terminal.setCashOutCallback(handleCashOut);
  terminal.setGoCallback(handleGoClick);
  app.stage.addChild(terminal.scene);

  // Death screen (Dark Souls style "YOU DIED")


  for (let i = 0; i < buttonPositions.length; i++) {
    const difficulty = portalDifficulties[i];
    const initialBgUrl = getRandomBackground(difficulty);
    const b = new Portal(
      buttonPositions[i],
      difficulty,
      initialBgUrl,
      (B) => {
        if (portalsEnabled) {
          selectPortal(i);
        }
      },
      () => {},
      () => {
        // Hover - show quick preview
        if (portalsEnabled) {
          showPortalHoverInfo(i);
        }
      },
      () => {}
    );
    b.render(app);
    b.addAnimations(app);
    buttons.push(b);
    app.stage.addChild(b.scene);
  }
  const deathScreen = new DeathScreen(app.screen.width, app.screen.height);
  app.stage.addChild(deathScreen.scene);
  /**
   * Update all terminal sections with current state
   */
  function updateTerminalSections() {
    const state = gameState.getState();
    const round = state.activeRound;
    
    // Update balance
    terminal.setBalance(state.balance);
    
    // Update round money
    terminal.setCurrentRoundMoney(round?.accumulatedWinnings || 0);
    
    // Show cash out if we have winnings
    if (state.canCashOut && round) {
      terminal.showCashOutButton(true, round.accumulatedWinnings);
    } else {
      terminal.showCashOutButton(false);
    }
  }

  /**
   * Select a portal and show its info in terminal
   */
  function selectPortal(portalIndex: number) {
    // Deselect previous portal if any
    if (selectedPortalIndex !== -1 && selectedPortalIndex !== portalIndex) {
      buttons[selectedPortalIndex].setSelected(false);
    }
    
    selectedPortalIndex = portalIndex;
    const clickedPortal = buttons[portalIndex];
    const difficulty = clickedPortal.difficulty;
    const info = portalInfo[difficulty];
    
    console.log('Portal selected! Difficulty:', difficulty);
    
    // Scale up selected portal
    clickedPortal.setSelected(true);
    
    // Update portal info section
    terminal.setPortalInfo(info);
    
    // Show Go button
    terminal.showGoButton(true);
    
    // Update other sections
    updateTerminalSections();
  }

  /**
   * Show quick hover info for portal
   */
  function showPortalHoverInfo(portalIndex: number) {
    // Only show hover info if no portal is selected
    if (selectedPortalIndex !== -1) return;
    
    const hoveredPortal = buttons[portalIndex];
    const difficulty = hoveredPortal.difficulty;
    const info = portalInfo[difficulty];
    
    console.log(`Hovering: ${info.name} - ${info.chance} chance, ${info.multiplier} reward`);
  }

  /**
   * Handle Go! button click - enter the selected portal
   */
  async function handleGoClick() {
    if (selectedPortalIndex === -1) {
      terminal.setLastEventResult('Select a portal\nfirst!');
      return;
    }
    
    const portalIndex = selectedPortalIndex;
    const clickedPortal = buttons[portalIndex];
    const difficulty = clickedPortal.difficulty;
    const apiDifficulty = difficultyToApi[difficulty];
    const portalBackgroundUrl = clickedPortal.getBackgroundUrl();
    const info = portalInfo[difficulty];
    
    console.log('GO! Entering portal. Difficulty:', difficulty);
    
    // Disable portals and hide Go button during API call and animation
    portalsEnabled = false;
    terminal.showGoButton(false);
    terminal.setPortalInfo(null);
    
    // Reset selected portal scale
    clickedPortal.setSelected(false);
    selectedPortalIndex = -1;
    
    // Update last event to show we're entering
    terminal.setLastEventResult(`Entering\n${info.worldName}...`);
    
    // Check if we have an active round (continue) or need to start new one
    const hasActiveRound = gameState.hasActiveRound();
    
    let result;
    
    if (hasActiveRound) {
      // Continue existing round
      result = await gameState.continueRound();
    } else {
      // Start new round
      if (!gameState.canAffordBet(currentBetAmount)) {
        terminal.setLastEventResult(`Not enough gold!\nNeed ${currentBetAmount}g`);
        portalsEnabled = true;
        return;
      }
      
      result = await gameState.startRound(apiDifficulty, currentBetAmount);
    }
    
    if (!result.success) {
      terminal.setLastEventResult(`Error:\n${result.error}`);
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

      // Update terminal with result
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

    // Update balance and round money
    terminal.setBalance(state.balance);
    terminal.setCurrentRoundMoney(round?.accumulatedWinnings || 0);

    if (result.isWin) {
      // Win - show result
      const eventNum = round?.events?.length || 1;
      const multiplier = round?.currentMultiplier?.toFixed(2) || '1.00';
      const nextDifficulty = round?.nextEventDifficulty || 0;

      let eventText = `WIN!\n`;
      eventText += `Event #${eventNum}\n`;
      eventText += `+${result.reward}g\n`;
      eventText += `(${multiplier}x)\n`;

      terminal.setLastEventResult(eventText);

      // Show Cash Out button if possible
      if (state.canCashOut && round) {
        terminal.showCashOutButton(true, round.accumulatedWinnings);
      }
    } else {
      // Loss - show death screen Dark Souls style
      const lostAmount = result.totalLost || 0;
      
      // Show "YOU DIED" screen
      deathScreen.show(() => {
        // After death screen, reset to home state
        resetToHomeScreen(lostAmount);
      });

      // Hide Cash Out button
      terminal.showCashOutButton(false);
    }
  }

  /**
   * Reset game to home screen after death - show menu again
   */
  function resetToHomeScreen(lostAmount: number) {
    const state = gameState.getState();
    
    // Reset background to village
    background.texture = Texture.from(initialBackground);
    
    // Update terminal
    terminal.setBalance(state.balance);
    terminal.setCurrentRoundMoney(0);
    terminal.setLastEventResult(`DEFEAT!\nLost: ${lostAmount}g`);
    terminal.setPortalInfo(null);
    terminal.showGoButton(false);
    terminal.showCashOutButton(false);
    
    // Hide portals
    buttons.forEach((portal) => {
      portal.hide(0);
    });
    
    // Show menu again
    showMenu();
  }

  /**
   * Show the menu and set up for new game
   */
  function showMenu() {
    // Create new menu instance
    const newMenu = new Menu(app.screen.width, app.screen.height, (betAmount: number) => {
      currentBetAmount = betAmount;
      newMenu.destroy();
      // Game is now visible and playable - update terminal with initial state
      updateTerminalSections();
      terminal.setLastEventResult(`Welcome!\nBet: ${currentBetAmount}g\nSelect a portal\nto begin!`);
      
      // Reveal portals with new backgrounds
      buttons.forEach((portal, index) => {
        const newBgUrl = getRandomBackground(portalDifficulties[index]);
        portal.setBackground(newBgUrl);
        portal.reveal(500);
      });
      
      // Re-enable portals
      setTimeout(() => {
        portalsEnabled = true;
      }, 600);
    });
    app.stage.addChild(newMenu.scene);
  }

  /**
   * Handle Cash Out action
   */
  async function handleCashOut() {
    portalsEnabled = false;
    terminal.showGoButton(false);
    terminal.setPortalInfo(null);
    selectedPortalIndex = -1;
    
    terminal.setLastEventResult('Cashing out...');

    const result = await gameState.cashOut();

    if (result.success) {
      const state = gameState.getState();
      
      terminal.setBalance(state.balance);
      terminal.setCurrentRoundMoney(0);
      terminal.setLastEventResult(`CASHED OUT!\nWon: ${result.totalWinnings}g\nNice one!`);
      terminal.showCashOutButton(false);
    } else {
      terminal.setLastEventResult(`Error:\n${result.error}`);
    }

    portalsEnabled = true;
  }

  // Starting menu
  const menu = new Menu(app.screen.width, app.screen.height, (betAmount: number) => {
    currentBetAmount = betAmount;
    menu.destroy();
    // Game is now visible and playable - update terminal with initial state
    updateTerminalSections();
    terminal.setLastEventResult(`Welcome!\nBet: ${currentBetAmount}g\nSelect a portal\nto begin!`);
  });
  app.stage.addChild(menu.scene);

  // Subscribe to game state changes to update UI
  gameState.subscribe((state) => {
    terminal.setBalance(state.balance);
    
    if (state.activeRound) {
      terminal.setCurrentRoundMoney(state.activeRound.accumulatedWinnings);
    }
    
    // Update cash out button visibility based on state
    if (state.canCashOut && state.activeRound) {
      terminal.showCashOutButton(true, state.activeRound.accumulatedWinnings);
    } else if (!state.canCashOut) {
      terminal.showCashOutButton(false);
    }
  });
})();
