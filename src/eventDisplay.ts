import { Application, Assets, Container, Sprite, Texture } from 'pixi.js';

// Base URL for GitHub assets (events folder)
const EVENTS_BASE_URL = 'https://raw.githubusercontent.com/tosh00/BFGameJamFrontAssets/refs/heads/main/events';

// Available events (currently just 1, but can expand)
const AVAILABLE_EVENTS = ['1', '2', '3'];

export type EventOutcome = 'good' | 'bad';

export default class EventDisplay {
  scene: Container;
  private eventSprite: Sprite | null = null;
  private screenWidth: number;
  private screenHeight: number;
  private backgroundBottomOffset: number;
  private currentEventId: string | null = null;

  constructor(screenWidth: number, screenHeight: number, backgroundBottomOffset: number) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.backgroundBottomOffset = backgroundBottomOffset;

    this.scene = new Container({ isRenderGroup: true });
    this.scene.visible = false;
  }

  /**
   * Get the URL for an event asset
   */
  private getEventAssetUrl(eventId: string, type: 'init' | 'good' | 'bad'): string {
    return `${EVENTS_BASE_URL}/${eventId}/${type}.png`;
  }

  /**
   * Get a random event ID
   */
  private getRandomEventId(): string {
    const index = Math.floor(Math.random() * AVAILABLE_EVENTS.length);
    return AVAILABLE_EVENTS[index];
  }

  /**
   * Preload event assets for a specific event
   */
  async preloadEvent(eventId: string): Promise<void> {
    const urls = [
      this.getEventAssetUrl(eventId, 'init'),
      this.getEventAssetUrl(eventId, 'good'),
      this.getEventAssetUrl(eventId, 'bad'),
    ];

    try {
      await Assets.load(urls);
    } catch (e) {
      console.warn(`Failed to preload event ${eventId} assets:`, e);
    }
  }

  /**
   * Show event animation sequence
   * @param outcome - 'good' or 'bad' result
   * @param onInitShown - called when init image is shown (for character shift)
   * @param onOutcomeShown - called when outcome is shown
   * @param onComplete - called when animation is complete
   */
  async showEvent(
    outcome: EventOutcome,
    onInitShown?: () => void,
    onOutcomeShown?: () => void,
    onComplete?: () => void
  ): Promise<void> {
    // Pick random event
    this.currentEventId = this.getRandomEventId();

    // Preload assets
    await this.preloadEvent(this.currentEventId);

    // Show init image
    await this.showInitPhase(onInitShown);

    // Wait 2 seconds
    await this.delay(2000);

    // Show outcome (good or bad)
    await this.showOutcomePhase(outcome, onOutcomeShown);

    // Wait for reaction
    await this.delay(1000);

    // Handle completion based on outcome
    if (outcome === 'good') {
      // Good: event disappears downward
      await this.animateExitDown();
    }
    // Bad: death screen handles the transition, just hide

    this.hide();

    if (onComplete) {
      onComplete();
    }
  }

  /**
   * Show the init phase of the event
   */
  private async showInitPhase(onInitShown?: () => void): Promise<void> {
    if (!this.currentEventId) return;

    // Create sprite with init texture
    const initUrl = this.getEventAssetUrl(this.currentEventId, 'init');
    const texture = Texture.from(initUrl);

    this.eventSprite = new Sprite(texture);
    this.eventSprite.anchor.set(0.5);
    this.eventSprite.x = this.screenWidth / 2;
    this.eventSprite.y = (this.screenHeight - this.backgroundBottomOffset) / 2;

    // Scale to fit nicely in the scene (larger for visibility)
    // const maxWidth = this.screenWidth * 0.8;
    // const maxHeight = (this.screenHeight - this.backgroundBottomOffset) * 0.8;
    // const scale = Math.min(maxWidth / texture.width, maxHeight / texture.height, 3);
    // this.eventSprite.scale.set(1);

    // Start with alpha 0 for fade in
    this.eventSprite.alpha = 0;

    this.scene.addChild(this.eventSprite);
    this.scene.visible = true;

    // Fade in animation
    await this.fadeIn(this.eventSprite, 500);

    if (onInitShown) {
      onInitShown();
    }
  }

  /**
   * Show the outcome phase (good or bad)
   */
  private async showOutcomePhase(outcome: EventOutcome, onOutcomeShown?: () => void): Promise<void> {
    if (!this.currentEventId || !this.eventSprite) return;

    // Change texture to outcome
    const outcomeUrl = this.getEventAssetUrl(this.currentEventId, outcome);
    const texture = Texture.from(outcomeUrl);
    this.eventSprite.texture = texture;

    // Scale effect on change
    const originalScale = this.eventSprite.scale.x;
    await this.pulseScale(this.eventSprite, originalScale, 300);

    if (onOutcomeShown) {
      onOutcomeShown();
    }
  }

  /**
   * Animate the event sprite exiting downward (for good outcome)
   */
  private async animateExitDown(): Promise<void> {
    if (!this.eventSprite) return;

    const duration = 600;
    const startY = this.eventSprite.y;
    const endY = this.screenHeight + 100;
    const startAlpha = this.eventSprite.alpha;

    return new Promise((resolve) => {
      const startTime = performance.now();

      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease in (accelerate down like falling)
        const easeProgress = progress * progress;

        this.eventSprite!.y = startY + (endY - startY) * easeProgress;
        this.eventSprite!.alpha = startAlpha * (1 - progress);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Fade in animation for a sprite
   */
  private fadeIn(sprite: Sprite, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = performance.now();

      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out for smooth appearance
        const easeProgress = 1 - Math.pow(1 - progress, 2);
        sprite.alpha = easeProgress;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Pulse scale effect
   */
  private pulseScale(sprite: Sprite, baseScale: number, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const pulseAmount = 0.15;

      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Sin wave for pulse (up then back down)
        const pulse = Math.sin(progress * Math.PI) * pulseAmount;
        sprite.scale.set(baseScale + pulse);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          sprite.scale.set(baseScale);
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Simple delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Hide the event display
   */
  hide(): void {
    this.scene.visible = false;
    if (this.eventSprite) {
      this.scene.removeChild(this.eventSprite);
      this.eventSprite.destroy();
      this.eventSprite = null;
    }
    this.currentEventId = null;
  }

  /**
   * Reset state
   */
  reset(): void {
    this.hide();
  }
}
