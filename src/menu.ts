import { Container, Graphics, Text } from 'pixi.js';
import gameState from './gameState';

export default class Menu {
  scene: Container;
  private onStart: () => void;
  private statusText: Text | null = null;
  private button: Graphics | null = null;
  private buttonText: Text | null = null;
  private screenWidth: number;
  private screenHeight: number;

  constructor(screenWidth: number, screenHeight: number, onStart: () => void) {
    this.onStart = onStart;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.scene = new Container();

    // Dark overlay background
    const overlay = new Graphics();
    overlay.rect(0, 0, screenWidth, screenHeight);
    overlay.fill({ color: 0x000000, alpha: 0.85 });
    this.scene.addChild(overlay);

    // Title text
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
    title.y = screenHeight / 3;
    this.scene.addChild(title);

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
    subtitle.y = screenHeight / 3 + 60;
    this.scene.addChild(subtitle);

    // Start button
    const buttonWidth = 200;
    const buttonHeight = 60;
    const buttonX = screenWidth / 2 - buttonWidth / 2;
    const buttonY = screenHeight / 2 + 40;

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

  private async startGame() {
    if (!this.button || !this.buttonText || !this.statusText) return;

    // Disable button and show loading
    this.button.interactive = false;
    this.buttonText.text = 'Connecting...';
    this.statusText.text = 'Creating session...';

    const success = await gameState.createSession();

    if (success) {
      this.statusText.text = `Connected! Balance: ${gameState.getState().balance} gold`;
      // Short delay to show the message, then start
      setTimeout(() => {
        this.onStart();
      }, 500);
    } else {
      // Re-enable button on failure
      this.button.interactive = true;
      this.buttonText.text = 'Start Game';
      this.statusText.text = 'Failed to connect. Try again.';
      this.statusText.style.fill = 0xff6666;
    }
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
