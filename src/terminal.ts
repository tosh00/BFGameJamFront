import { Container, Graphics, Text } from 'pixi.js';

// Windows 95 color palette
const WIN95 = {
  background: 0x008080,      // Teal desktop
  buttonFace: 0xc0c0c0,      // Button gray
  buttonHighlight: 0xffffff, // White highlight
  buttonShadow: 0x808080,    // Dark gray shadow
  buttonDarkShadow: 0x000000,// Black
  windowBg: 0xc0c0c0,        // Window background
  titleBar: 0x000080,        // Blue title bar
  titleText: 0xffffff,       // White title text
  text: 0x000000,            // Black text
};

// Section data interface
export interface TerminalSections {
  balance: number;
  currentRoundMoney: number;
  lastEventResult: string;
  portalInfo: {
    name: string;
    worldName: string;
    chance: string;
    multiplier: string;
    color: string;
  } | null;
}

export default class Terminal {
  scene: Container;
  x: number = 0;
  y: number = 0;
  screenWidth: number = 0;
  terminalHeight: number = 0;

  // Section containers
  private balanceSection: Container | null = null;
  private roundMoneySection: Container | null = null;
  private lastEventSection: Container | null = null;
  private portalInfoSection: Container | null = null;

  // Section text elements
  private balanceText: Text | null = null;
  private roundMoneyText: Text | null = null;
  private lastEventText: Text | null = null;
  private portalNameText: Text | null = null;
  private portalDetailsText: Text | null = null;

  // Buttons
  private goButton: Container | null = null;
  private goButtonText: Text | null = null;
  private cashOutButton: Container | null = null;
  private cashOutText: Text | null = null;

  // Callbacks
  private onGo: (() => void) | null = null;
  private onCashOut: (() => void) | null = null;

  // Current data
  private sections: TerminalSections = {
    balance: 0,
    currentRoundMoney: 0,
    lastEventResult: 'No events yet',
    portalInfo: null,
  };

  constructor(backgroundBottomOffset: number = 0, screenHeight: number = 0, screenWidth: number = 0) {
    this.scene = new Container({ isRenderGroup: true });
    this.x = 0;
    this.y = screenHeight - backgroundBottomOffset;
    this.screenWidth = screenWidth;
    this.terminalHeight = backgroundBottomOffset;

    // Main background (teal like Win95 desktop)
    const background = new Graphics()
      .rect(this.x, this.y, screenWidth, backgroundBottomOffset)
      .fill({ color: WIN95.background });
    this.scene.addChild(background);
  }

  render(app: any) {
    const buttonAreaWidth = 170;
    const sectionsAreaWidth = this.screenWidth - buttonAreaWidth - 20;
    const sectionWidth = (sectionsAreaWidth - 15) / 2; // 2 columns with gap
    const sectionHeight = (this.terminalHeight - 25) / 2; // 2 rows with gap
    const startY = this.y + 5;
    const gap = 5;

    // Create 2x2 grid of sections
    // Row 1
    this.balanceSection = this.createWin95Window('Balance', 10, startY, sectionWidth, sectionHeight);
    this.roundMoneySection = this.createWin95Window('Round', 10 + sectionWidth + gap, startY, sectionWidth, sectionHeight);
    // Row 2
    this.lastEventSection = this.createWin95Window('Last Event', 10, startY + sectionHeight + gap, sectionWidth, sectionHeight);
    this.portalInfoSection = this.createWin95Window('Portal', 10 + sectionWidth + gap, startY + sectionHeight + gap, sectionWidth, sectionHeight);

    // Add text to sections
    this.balanceText = this.createSectionText(this.balanceSection, sectionWidth - 15);
    this.roundMoneyText = this.createSectionText(this.roundMoneySection, sectionWidth - 15);
    this.lastEventText = this.createSectionText(this.lastEventSection, sectionWidth - 15);
    
    // Portal info has two text elements
    this.portalNameText = new Text({
      text: '',
      style: {
        fontFamily: '"MS Sans Serif", Arial, sans-serif',
        fontSize: 12,
        fill: WIN95.text,
        fontWeight: 'bold',
        wordWrap: true,
        wordWrapWidth: sectionWidth - 20,
      },
    });
    this.portalNameText.position.set(5, 22);
    this.portalInfoSection.addChild(this.portalNameText);

    this.portalDetailsText = new Text({
      text: 'Click a portal\nto select',
      style: {
        fontFamily: '"MS Sans Serif", Arial, sans-serif',
        fontSize: 11,
        fill: WIN95.text,
        wordWrap: true,
        wordWrapWidth: sectionWidth - 20,
      },
    });
    this.portalDetailsText.position.set(5, 20);
    this.portalInfoSection.addChild(this.portalDetailsText);

    // Create buttons on the right side (stacked vertically)
    const buttonX = this.screenWidth - buttonAreaWidth + 5;
    const buttonWidth = buttonAreaWidth - 20;
    const buttonHeight = (this.terminalHeight - 25) / 2;
    
    this.createWin95GoButton(buttonX, startY, buttonWidth, buttonHeight);
    this.createWin95CashOutButton(buttonX, startY + buttonHeight + gap, buttonWidth, buttonHeight);

    // Initial update
    this.updateAllSections();
  }

  private createWin95Window(title: string, x: number, y: number, width: number, height: number): Container {
    const container = new Container();
    container.position.set(x, y);

    // Outer bevel (3D effect)
    const outer = new Graphics();
    // Light top-left edge
    outer.moveTo(0, height).lineTo(0, 0).lineTo(width, 0);
    outer.stroke({ width: 2, color: WIN95.buttonHighlight });
    // Dark bottom-right edge
    outer.moveTo(width, 0).lineTo(width, height).lineTo(0, height);
    outer.stroke({ width: 2, color: WIN95.buttonDarkShadow });
    container.addChild(outer);

    // Inner background
    const inner = new Graphics()
      .rect(2, 2, width - 4, height - 4)
      .fill({ color: WIN95.windowBg });
    container.addChild(inner);

    // Title bar
    const titleBar = new Graphics()
      .rect(3, 3, width - 6, 16)
      .fill({ color: WIN95.titleBar });
    container.addChild(titleBar);

    // Title text
    const titleText = new Text({
      text: title,
      style: {
        fontFamily: '"MS Sans Serif", Arial, sans-serif',
        fontSize: 10,
        fill: WIN95.titleText,
        fontWeight: 'bold',
      },
    });
    titleText.position.set(5, 4);
    container.addChild(titleText);

    this.scene.addChild(container);
    return container;
  }

  private createSectionText(container: Container, maxWidth: number): Text {
    const text = new Text({
      text: '',
      style: {
        fontFamily: '"MS Sans Serif", Arial, sans-serif',
        fontSize: 11,
        fill: WIN95.text,
        wordWrap: true,
        wordWrapWidth: maxWidth,
      },
    });
    text.position.set(5, 22);
    container.addChild(text);
    return text;
  }

  private createWin95Button(
    x: number, y: number, width: number, height: number,
    label: string, bgColor: number = WIN95.buttonFace
  ): { container: Container; text: Text; bg: Graphics } {
    const container = new Container();
    container.position.set(x, y);
    container.interactive = true;
    container.cursor = 'pointer';

    // Button background
    const bg = new Graphics();
    this.drawButtonUp(bg, width, height, bgColor);
    container.addChild(bg);

    // Button text
    const text = new Text({
      text: label,
      style: {
        fontFamily: '"MS Sans Serif", Arial, sans-serif',
        fontSize: 14,
        fill: WIN95.text,
        fontWeight: 'bold',
      },
    });
    text.anchor.set(0.5);
    text.position.set(width / 2, height / 2);
    container.addChild(text);

    // Events
    container.on('pointerdown', () => {
      this.drawButtonDown(bg, width, height, bgColor);
      text.position.set(width / 2 + 1, height / 2 + 1);
    });

    container.on('pointerup', () => {
      this.drawButtonUp(bg, width, height, bgColor);
      text.position.set(width / 2, height / 2);
    });

    container.on('pointerupoutside', () => {
      this.drawButtonUp(bg, width, height, bgColor);
      text.position.set(width / 2, height / 2);
    });

    this.scene.addChild(container);
    return { container, text, bg };
  }

  private drawButtonUp(g: Graphics, w: number, h: number, bgColor: number) {
    g.clear();
    // Main face
    g.rect(0, 0, w, h).fill({ color: bgColor });
    // Top-left highlight (white)
    g.moveTo(0, h).lineTo(0, 0).lineTo(w, 0);
    g.stroke({ width: 2, color: WIN95.buttonHighlight });
    // Inner highlight
    g.moveTo(1, h - 1).lineTo(1, 1).lineTo(w - 1, 1);
    g.stroke({ width: 1, color: 0xdfdfdf });
    // Bottom-right shadow (dark)
    g.moveTo(w, 0).lineTo(w, h).lineTo(0, h);
    g.stroke({ width: 2, color: WIN95.buttonDarkShadow });
    // Inner shadow
    g.moveTo(w - 1, 1).lineTo(w - 1, h - 1).lineTo(1, h - 1);
    g.stroke({ width: 1, color: WIN95.buttonShadow });
  }

  private drawButtonDown(g: Graphics, w: number, h: number, bgColor: number) {
    g.clear();
    // Main face
    g.rect(0, 0, w, h).fill({ color: bgColor });
    // Inverted - dark on top-left
    g.moveTo(0, h).lineTo(0, 0).lineTo(w, 0);
    g.stroke({ width: 2, color: WIN95.buttonDarkShadow });
    g.moveTo(1, h - 1).lineTo(1, 1).lineTo(w - 1, 1);
    g.stroke({ width: 1, color: WIN95.buttonShadow });
    // Light on bottom-right
    g.moveTo(w, 0).lineTo(w, h).lineTo(0, h);
    g.stroke({ width: 2, color: WIN95.buttonHighlight });
  }

  private createWin95GoButton(x: number, y: number, width: number, height: number) {
    const { container, text } = this.createWin95Button(x, y, width, height, 'GO!', 0x90EE90);
    this.goButton = container;
    this.goButtonText = text;
    container.visible = false;

    container.on('pointerup', () => {
      if (this.onGo) this.onGo();
    });
  }

  private createWin95CashOutButton(x: number, y: number, width: number, height: number) {
    const { container, text } = this.createWin95Button(x, y, width, height, 'CASH OUT', 0xFFD700);
    this.cashOutButton = container;
    this.cashOutText = text;
    container.visible = false;

    container.on('pointerup', () => {
      if (this.onCashOut) this.onCashOut();
    });
  }

  // Public methods to update sections
  updateAllSections() {
    this.updateBalanceSection();
    this.updateRoundMoneySection();
    this.updateLastEventSection();
    this.updatePortalInfoSection();
  }

  private updateBalanceSection() {
    if (this.balanceText) {
      this.balanceText.text = `${this.sections.balance} gold\nBet: 10 gold`;
    }
  }

  private updateRoundMoneySection() {
    if (this.roundMoneyText) {
      if (this.sections.currentRoundMoney > 0) {
        this.roundMoneyText.text = `Accumulated:\n${this.sections.currentRoundMoney} gold\n[AT RISK]`;
      } else {
        this.roundMoneyText.text = 'No active round\nSelect a portal!';
      }
    }
  }

  private updateLastEventSection() {
    if (this.lastEventText) {
      this.lastEventText.text = this.sections.lastEventResult;
    }
  }

  private updatePortalInfoSection() {
    if (this.portalNameText && this.portalDetailsText) {
      if (this.sections.portalInfo) {
        const p = this.sections.portalInfo;
        // this.portalNameText.text = `[${p.name.toUpperCase()}]`;
        this.portalDetailsText.text = 
          `World: ${p.worldName}\n` +
          `Chance: ${p.chance}\n` +
          `Reward: ${p.multiplier}`;
      } else {
        // this.portalNameText.text = '';
        this.portalDetailsText.text = 'Click a portal\nto select';
      }
    }
  }

  // Setters for section data
  setBalance(balance: number) {
    this.sections.balance = balance;
    this.updateBalanceSection();
  }

  setCurrentRoundMoney(amount: number) {
    this.sections.currentRoundMoney = amount;
    this.updateRoundMoneySection();
  }

  setLastEventResult(result: string) {
    this.sections.lastEventResult = result;
    this.updateLastEventSection();
  }

  setPortalInfo(info: TerminalSections['portalInfo']) {
    this.sections.portalInfo = info;
    this.updatePortalInfoSection();
  }

  // Button visibility
  showGoButton(show: boolean) {
    if (this.goButton) this.goButton.visible = show;
  }

  showCashOutButton(show: boolean, winnings?: number) {
    if (this.cashOutButton) this.cashOutButton.visible = show;
    if (this.cashOutText && show && winnings !== undefined) {
      this.cashOutText.text = `CASH OUT\n(${winnings}g)`;
    }
  }

  // Callbacks
  setGoCallback(callback: () => void) {
    this.onGo = callback;
  }

  setCashOutCallback(callback: () => void) {
    this.onCashOut = callback;
  }

  // Legacy method for compatibility
  setText(newText: string) {
    console.log('setText called (legacy):', newText);
  }

  // No-op update (no typewriter effect needed now)
  update() {}
}
