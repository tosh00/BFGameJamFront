import { BitmapText, Container, Graphics } from 'pixi.js';

export default class Terminal {
  scene: Container;
  background: Graphics;
  textColor = '#0cc224';
  x: number = 0;
  y: number = 0;
  offsets = 20;
  text: string =
    'test terminal text.\n This is a long text to demonstrate word\n wrapping functionality in the terminal display area.';

  // Typewriter effect properties
  private displayedText: string = '';
  private charIndex: number = 0;
  private textElement: BitmapText | null = null;
  private typeSpeed: number = 50; // milliseconds per character
  private lastTypeTime: number = 0;
  private isTyping: boolean = false;

  constructor(backgroundBottomOffset: number = 0, screenHeight: number = 0, screenWidth: number = 0) {
    this.scene = new Container({
      isRenderGroup: true,
    });
    this.x = 0;
    this.y = screenHeight - backgroundBottomOffset;
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

    // Start typewriter effect
    this.startTyping();
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
