import { BitmapText, Container, Graphics, Text } from 'pixi.js';

export default class Terminal {
  scene: Container;
  background: Graphics;
  textColor = '0x0cc224';
  x: number = 0;
  y: number = 0;
  screenWidth: number = 0;
  offsets = 20;
  balance: number = 0;
  text: string = ""
  // Typewriter effect properties
  private displayedText: string = '';
  private charIndex: number = 0;
  private textElement: BitmapText | null = null;
  private typeSpeed: number = 10; // milliseconds per character
  private lastTypeTime: number = 0;
  private isTyping: boolean = false;

  // Cash out button
  private cashOutButton: Graphics | null = null;
  private cashOutText: Text | null = null;
  private onCashOut: (() => void) | null = null;

  constructor(backgroundBottomOffset: number = 0, screenHeight: number = 0, screenWidth: number = 0) {
    this.scene = new Container({
      isRenderGroup: true,
    });
    this.x = 0;
    this.y = screenHeight - backgroundBottomOffset;
    this.screenWidth = screenWidth;
    this.background = new Graphics().rect(this.x, this.y, screenWidth, backgroundBottomOffset);
    this.background.fill({ color: 0x031703 });
    this.scene.addChild(this.background);
  }

  render(app: any) {
    this.textElement = new BitmapText({
      text: '',
      style: {
        fontFamily: 'Desyrel',
        fontSize: 15,
      },
      anchor: 0,
    });
    this.textElement.position.set(this.x + this.offsets, this.y + this.offsets);

    this.scene.addChild(this.textElement);

    // Create Cash Out button
    this.createCashOutButton();

    // Start typewriter effect
    this.startTyping();
  }

  private createCashOutButton() {
    const buttonWidth = 140;
    const buttonHeight = 50;
    const buttonX = this.screenWidth - buttonWidth - 20;
    const buttonY = this.y + 20;

    this.cashOutButton = new Graphics();
    this.cashOutButton.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
    this.cashOutButton.fill({ color: 0xffc107 });
    this.cashOutButton.interactive = true;
    this.cashOutButton.cursor = 'pointer';
    this.cashOutButton.visible = false; // Hidden by default

    this.cashOutButton.on('pointerover', () => {
      if (!this.cashOutButton) return;
      this.cashOutButton.clear();
      this.cashOutButton.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
      this.cashOutButton.fill({ color: 0xffca28 });
    });

    this.cashOutButton.on('pointerout', () => {
      if (!this.cashOutButton) return;
      this.cashOutButton.clear();
      this.cashOutButton.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
      this.cashOutButton.fill({ color: 0xffc107 });
    });

    this.cashOutButton.on('pointerdown', () => {
      if (!this.cashOutButton) return;
      this.cashOutButton.clear();
      this.cashOutButton.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
      this.cashOutButton.fill({ color: 0xffa000 });
    });

    this.cashOutButton.on('pointerup', () => {
      if (this.onCashOut) {
        this.onCashOut();
      }
    });

    this.scene.addChild(this.cashOutButton);

    // Button text
    this.cashOutText = new Text({
      text: '💰 CASH OUT',
      style: {
        fontFamily: 'Arial',
        fontSize: 18,
        fill: 0x000000,
        fontWeight: 'bold',
      },
    });
    this.cashOutText.anchor.set(0.5);
    this.cashOutText.x = buttonX + buttonWidth / 2;
    this.cashOutText.y = buttonY + buttonHeight / 2;
    this.cashOutText.visible = false;
    this.scene.addChild(this.cashOutText);
  }

  /**
   * Set the callback for cash out button
   */
  setCashOutCallback(callback: () => void) {
    this.onCashOut = callback;
  }

  /**
   * Show/hide the cash out button
   */
  showCashOutButton(show: boolean, winnings?: number) {
    if (this.cashOutButton) {
      this.cashOutButton.visible = show;
    }
    if (this.cashOutText) {
      this.cashOutText.visible = show;
      if (show && winnings !== undefined) {
        this.cashOutText.text = `💰 CASH OUT\n(${winnings} gold)`;
      }
    }
  }

  startTyping() {
    this.displayedText = '';
    this.charIndex = 0;
    this.isTyping = true;
    this.lastTypeTime = performance.now();
  }

  update() {
    if (!this.isTyping || !this.textElement) return;

    const now = performance.now();
    if (now - this.lastTypeTime >= this.typeSpeed) {
      if (this.charIndex < this.text.length) {
        this.displayedText += this.text[this.charIndex];
        this.textElement.text = this.displayedText;
        this.charIndex++;
        this.lastTypeTime = now;
      } else {
        this.isTyping = false;
      }
    }
  }

  setText(newText: string) {
    this.text = newText;
    this.startTyping();
  }
}
