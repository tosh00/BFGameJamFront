import { Container, Graphics, Text, Sprite, Assets } from 'pixi.js';
import gameState from './gameState';
import { asset } from './utils/utils';

// Available bet amounts
const BET_OPTIONS = [5, 10, 25, 50, 100];

export default class Menu {
  scene: Container;
  private onStart: (betAmount: number) => void;
  private statusText: Text | null = null;
  private button: Graphics | null = null;
  private buttonText: Text | null = null;
  private screenWidth: number;
  private screenHeight: number;
  
  // Bet selection
  private selectedBetIndex: number = 1; // Default to 10
  private betAmountText: Text | null = null;

  constructor(screenWidth: number, screenHeight: number, onStart: (betAmount: number) => void) {
    this.onStart = onStart;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.scene = new Container();

    // Menu background image
    const menuBgTexture = Assets.get(asset('backgrounds/menu'));
    if (menuBgTexture) {
      const menuBackground = Sprite.from(menuBgTexture);
      menuBackground.width = screenWidth;
      menuBackground.height = screenHeight;
      this.scene.addChild(menuBackground);
    } else {
      // Fallback to dark overlay if texture not loaded
      const overlay = new Graphics();
      overlay.rect(0, 0, screenWidth, screenHeight);
      overlay.fill({ color: 0x000000, alpha: 0.85 });
      this.scene.addChild(overlay);
    }

    // Logo image instead of title text
    const logoTexture = Assets.get(asset('logo'));
    if (logoTexture) {
      const logo = Sprite.from(logoTexture);
      logo.anchor.set(0.5);
      logo.x = screenWidth / 2;
      logo.y = screenHeight / 4;
      // Scale logo to reasonable size (adjust as needed)
      const maxLogoWidth = screenWidth * 0.6;
      const maxLogoHeight = screenHeight * 0.25;
      const scaleX = maxLogoWidth / logo.width;
      const scaleY = maxLogoHeight / logo.height;
      const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
      logo.scale.set(scale);
      this.scene.addChild(logo);
    } else {
      // Fallback to text if logo not loaded
      const title = new Text({
        text: 'Echoes of Realms',
        style: {
          fontFamily: 'Arial',
          fontSize: 32,
          fill: 0xffffff,
          fontWeight: 'bold',
          dropShadow: {
            color: 0x6633ff,
            blur: 10,
            distance: 4,
          },
        },
      });
      title.anchor.set(0.5);
      title.x = screenWidth / 2;
      title.y = screenHeight / 2;
      this.scene.addChild(title);
    }

    // Subtitle
    const subtitle = new Text({
      text: 'A Realm Traveller Adventure',
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xaaaaaa,
      },
    });
    subtitle.anchor.set(0.5);
    subtitle.x = screenWidth / 2;
    subtitle.y = screenHeight / 4 + 150;
    this.scene.addChild(subtitle);

    // Balance display
    const state = gameState.getState();
    const balanceText = new Text({
      text: `Your Gold: ${state.balance}`,
      style: {
        fontFamily: 'Arial',
        fontSize: 22,
        fill: 0xffd700, // Gold color
        fontWeight: 'bold',
      },
    });
    balanceText.anchor.set(0.5);
    balanceText.x = screenWidth / 2;
    balanceText.y = screenHeight / 4 + 190;
    this.scene.addChild(balanceText);

    // Bet selection section
    this.createBetSelector(screenWidth, screenHeight);

    // Start button
    const buttonWidth = 200;
    const buttonHeight = 60;
    const buttonX = screenWidth / 2 - buttonWidth / 2;
    const buttonY = screenHeight / 2 + 80;

    const button = new Graphics();
    button.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 12);
    button.fill({ color: 0x4caf50 });
    button.interactive = true;
    button.cursor = 'pointer';

    // Button hover effects
    button.on('pointerover', () => {
      button.clear();
      button.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 12);
      button.fill({ color: 0x66cc66 });
    });

    button.on('pointerout', () => {
      button.clear();
      button.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 12);
      button.fill({ color: 0x4caf50 });
    });

    button.on('pointerdown', () => {
      button.clear();
      button.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 12);
      button.fill({ color: 0x388e3c });
    });

    button.on('pointerup', () => {
      this.startGame();
    });

    this.scene.addChild(button);
    this.button = button;

    // Button text
    const buttonText = new Text({
      text: 'Start Game',
      style: {
        fontFamily: 'Arial',
        fontSize: 28,
        fill: 0xffffff,
        fontWeight: 'bold',
      },
    });
    buttonText.anchor.set(0.5);
    buttonText.x = screenWidth / 2;
    buttonText.y = buttonY + buttonHeight / 2;
    this.scene.addChild(buttonText);
    this.buttonText = buttonText;

    // Status text (for loading/error messages)
    this.statusText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial',
        fontSize: 18,
        fill: 0xffcc00,
      },
    });
    this.statusText.anchor.set(0.5);
    this.statusText.x = screenWidth / 2;
    this.statusText.y = buttonY + buttonHeight + 30;
    this.scene.addChild(this.statusText);
  }

  private createBetSelector(screenWidth: number, screenHeight: number) {
    const selectorY = screenHeight / 2;
    
    // Label
    const label = new Text({
      text: 'Bet Amount:',
      style: {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: 0xcccccc,
      },
    });
    label.anchor.set(0.5);
    label.x = screenWidth / 2;
    label.y = selectorY - 35;
    this.scene.addChild(label);

    // Minus button
    const minusBtn = this.createArrowButton(screenWidth / 2 - 100, selectorY, '<', () => {
      if (this.selectedBetIndex > 0) {
        this.selectedBetIndex--;
        this.updateBetDisplay();
      }
    });
    this.scene.addChild(minusBtn);

    // Bet amount display
    this.betAmountText = new Text({
      text: `${BET_OPTIONS[this.selectedBetIndex]} gold`,
      style: {
        fontFamily: 'Arial',
        fontSize: 28,
        fill: 0xffd700, // Gold color
        fontWeight: 'bold',
      },
    });
    this.betAmountText.anchor.set(0.5);
    this.betAmountText.x = screenWidth / 2;
    this.betAmountText.y = selectorY;
    this.scene.addChild(this.betAmountText);

    // Plus button
    const plusBtn = this.createArrowButton(screenWidth / 2 + 100, selectorY, '>', () => {
      if (this.selectedBetIndex < BET_OPTIONS.length - 1) {
        this.selectedBetIndex++;
        this.updateBetDisplay();
      }
    });
    this.scene.addChild(plusBtn);
  }

  private createArrowButton(x: number, y: number, text: string, onClick: () => void): Container {
    const container = new Container();
    const size = 40;
    
    const bg = new Graphics();
    bg.roundRect(-size/2, -size/2, size, size, 8);
    bg.fill({ color: 0x444444 });
    container.addChild(bg);

    const label = new Text({
      text: text,
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xffffff,
        fontWeight: 'bold',
      },
    });
    label.anchor.set(0.5);
    container.addChild(label);

    container.position.set(x, y);
    container.interactive = true;
    container.cursor = 'pointer';

    container.on('pointerover', () => {
      bg.clear();
      bg.roundRect(-size/2, -size/2, size, size, 8);
      bg.fill({ color: 0x666666 });
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.roundRect(-size/2, -size/2, size, size, 8);
      bg.fill({ color: 0x444444 });
    });

    container.on('pointerdown', () => {
      bg.clear();
      bg.roundRect(-size/2, -size/2, size, size, 8);
      bg.fill({ color: 0x333333 });
    });

    container.on('pointerup', () => {
      bg.clear();
      bg.roundRect(-size/2, -size/2, size, size, 8);
      bg.fill({ color: 0x666666 });
      onClick();
    });

    return container;
  }

  private updateBetDisplay() {
    if (this.betAmountText) {
      this.betAmountText.text = `${BET_OPTIONS[this.selectedBetIndex]} gold`;
    }
  }

  getSelectedBet(): number {
    return BET_OPTIONS[this.selectedBetIndex];
  }

  private async startGame() {
    if (!this.button || !this.buttonText || !this.statusText) return;

    // Session is already created on app init - just start the game with selected bet
    const state = gameState.getState();
    
    if (!state.sessionId) {
      this.statusText.text = 'No session found. Please refresh.';
      this.statusText.style.fill = 0xff6666;
      return;
    }

    // Check if player can afford the bet
    const selectedBet = this.getSelectedBet();
    if (!gameState.canAffordBet(selectedBet)) {
      this.statusText.text = `Not enough gold! Need ${selectedBet}g`;
      this.statusText.style.fill = 0xff6666;
      return;
    }

    // Start the game immediately
    this.onStart(selectedBet);
  }

  hide() {
    this.scene.visible = false;
  }

  show() {
    this.scene.visible = true;
  }

  destroy() {
    this.scene.destroy({ children: true });
  }
}
