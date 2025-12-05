import { Assets, Container, FederatedPointerEvent, Graphics, Sprite, Texture } from 'pixi.js';
import { asset } from './utils/utils';
import { Difficulty } from './utils/loadAssets';

export default class Portal {
  position: { x: number; y: number };
  scale: number = 0.8;
  difficulty: Difficulty;
  backgroundUrl: string;
  scene: Container;
  elements: Sprite[] = [];
  pointerOver = false;
  portalSprite!: Sprite;
  backgroundSprite!: Sprite;
  callbacks = {
    onButtonOver: (event: FederatedPointerEvent) => {},
    onButtonOut: (event: FederatedPointerEvent) => {},
    onButtonDown: (event: FederatedPointerEvent) => {},
    onButtonUp: (event: FederatedPointerEvent) => {},
  };

  constructor(
    position: { x: number; y: number },
    difficulty: Difficulty,
    backgroundUrl: string,
    onButtonDown?: (event: FederatedPointerEvent) => void,
    onButtonUp?: (event: FederatedPointerEvent) => void,
    onButtonOver?: (event: FederatedPointerEvent) => void,
    onButtonOut?: (event: FederatedPointerEvent) => void
  ) {
    this.scene = new Container({
      isRenderGroup: true,
    });
    this.position = position;
    this.difficulty = difficulty;
    this.backgroundUrl = backgroundUrl;
    this.callbacks.onButtonOver = onButtonOver || (() => {});
    this.callbacks.onButtonOut = onButtonOut || (() => {});
    this.callbacks.onButtonDown = onButtonDown || (() => {});
    this.callbacks.onButtonUp = onButtonUp || (() => {});
    this.portalSprite = new Sprite(Texture.from(asset('portal_big')));
    this.backgroundSprite = new Sprite(Texture.from(this.backgroundUrl));
  }

  /**
   * Get the current background URL of this portal
   */
  getBackgroundUrl(): string {
    return this.backgroundUrl;
  }

  /**
   * Update the portal's background with a new URL
   */
  setBackground(newUrl: string) {
    this.backgroundUrl = newUrl;
    this.backgroundSprite.texture = Texture.from(newUrl);
  }

  render(app: any) {
    this.portalSprite.anchor.set(0.5);
    this.portalSprite.x = this.position.x;
    this.portalSprite.y = this.position.y;
    this.portalSprite.scale.set(this.scale);

    this.backgroundSprite.anchor.set(0.5);
    this.backgroundSprite.width = this.portalSprite.width;
    this.backgroundSprite.height = this.portalSprite.height;
    this.backgroundSprite.x = this.position.x;
    this.backgroundSprite.y = this.position.y;
    this.portalSprite.scale.set(this.scale);
    console.log(this.backgroundSprite.x, this.backgroundSprite.y);

    const ellipseWidth = this.portalSprite.width * this.scale - 60;
    const ellipseHeight = this.portalSprite.height * this.scale;
    const ellipse = new Graphics().ellipse(
      this.portalSprite.x,
      this.portalSprite.y,
      ellipseWidth / 2,
      ellipseHeight / 2
    );
    this.backgroundSprite.mask = ellipse;
    ellipse.fill(0xffffff);

    this.portalSprite.eventMode = 'static';
    this.portalSprite.cursor = 'pointer';

    this.callbacks.onButtonOver = (event: FederatedPointerEvent) => {
      this.pointerOver = true;
      console.log('over portal');
    };
    this.callbacks.onButtonOut = (event: FederatedPointerEvent) => {
      this.pointerOver = false;
      console.log('out portal');
    };

    this.portalSprite
      .on('pointerover', this.callbacks.onButtonOver)
      .on('pointerdown', this.callbacks.onButtonDown)
      .on('pointerup', this.callbacks.onButtonUp)
      .on('pointerupoutside', this.callbacks.onButtonUp)
      .on('pointerout', this.callbacks.onButtonOut);

    this.elements.push(this.backgroundSprite, this.portalSprite);
    this.scene.addChild(this.backgroundSprite);
    this.scene.addChild(this.portalSprite);
    this.scene.addChild(ellipse);
  }

  addAnimations(app: any) {
    let tick = 0;
    app.ticker.add(() => {
      if (this.scene) {
        if (this.pointerOver) {
          this.scene.rotation = 0.05 * Math.sin(tick / 20);
        } else {
          this.scene.rotation = 0;
          tick = 0;
        }
      }

      // this.elements[0].x = 0.05 * Math.sin(tick / 20);
      tick++;
    });
  }

  getThroughtPortal(app: any) {
    let tick = 0;
    const targetHeight = app.screen.height;
    app.ticker.add(() => {
      if (this.scene) {
        if (tick < 100) {
          this.portalSprite.height = targetHeight * (tick / 100);
        }
      }
      // this.elements[0].x = 0.05 * Math.sin(tick / 20);
      tick++;
    });
  }

  /**
   * Hide the portal by scaling it down to 0
   */
  hide(duration: number = 0): Promise<void> {
    return new Promise((resolve) => {
      const startScale = this.scene.scale.x;
      const startTime = performance.now();

      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const newScale = startScale * (1 - easeProgress);

        this.scene.scale.set(newScale);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.scene.visible = false;
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Show the portal by scaling it up from 0
   */
  reveal(duration: number = 500): Promise<void> {
    return new Promise((resolve) => {
      this.scene.scale.set(0);
      this.scene.visible = true;

      const targetScale = 1;
      const startTime = performance.now();

      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out with bounce effect
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const overshoot = progress < 0.8 ? 0 : Math.sin((progress - 0.8) * Math.PI * 5) * 0.05 * (1 - progress);
        const newScale = targetScale * easeProgress + overshoot;

        this.scene.scale.set(newScale);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.scene.scale.set(targetScale);
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Hide, update background, then reveal with new background
   */
  async transitionToNewBackground(newUrl: string, hideDelay: number = 300): Promise<void> {

    await new Promise((resolve) => setTimeout(resolve, hideDelay));
    await this.hide(0);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Wait a bit before revealing

    // Update background while hidden
    this.setBackground(newUrl);

    // Reveal with new background
    await this.reveal(500);
  }
}
