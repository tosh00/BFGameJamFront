import { Container, Graphics, Text } from 'pixi.js';

export default class DeathScreen {
  scene: Container;
  private blackOverlay: Graphics;
  private deathText: Text;
  private screenWidth: number;
  private screenHeight: number;
  private onComplete: (() => void) | null = null;

  constructor(screenWidth: number, screenHeight: number) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.scene = new Container({ isRenderGroup: true });
    this.scene.visible = false;

    // Black overlay
    this.blackOverlay = new Graphics().rect(0, 0, screenWidth, screenHeight).fill({ color: 0x000000 });
    this.blackOverlay.alpha = 0;
    this.scene.addChild(this.blackOverlay);

    // "YOU DIED" text - Dark Souls style
    this.deathText = new Text({
      text: 'YOU DIED',
      style: {
        fontFamily: 'Times New Roman, serif',
        fontSize: 64,
        fill: 0x8b0000, // Dark red
        fontWeight: 'normal',
        letterSpacing: 12,
      },
    });
    this.deathText.anchor.set(0.5);
    this.deathText.x = screenWidth / 2;
    this.deathText.y = screenHeight / 2;
    this.deathText.alpha = 0;
    this.scene.addChild(this.deathText);
  }

  /**
   * Show the death screen with Dark Souls style animation
   */
  show(onComplete?: () => void): Promise<void> {
    this.onComplete = onComplete || null;
    this.scene.visible = true;

    return new Promise((resolve) => {
      const startTime = performance.now();
      const fadeInDuration = 1500; // Fade to black
      const textFadeInStart = 1000; // Text starts appearing
      const textFadeInDuration = 1500; // Text fade in
      const holdDuration = 2500; // Hold on screen
      const fadeOutDuration = 1000; // Fade out
      const totalDuration = fadeInDuration + holdDuration + fadeOutDuration;

      const animate = () => {
        const elapsed = performance.now() - startTime;

        // Phase 1: Fade to black
        if (elapsed < fadeInDuration) {
          const progress = elapsed / fadeInDuration;
          // Ease in
          const easeProgress = progress * progress;
          this.blackOverlay.alpha = easeProgress;
        } else {
          this.blackOverlay.alpha = 1;
        }

        // Phase 2: Text fade in (starts a bit before black is complete)
        if (elapsed > textFadeInStart && elapsed < textFadeInStart + textFadeInDuration) {
          const textProgress = (elapsed - textFadeInStart) / textFadeInDuration;
          // Ease in-out for text
          const easeText =
            textProgress < 0.5 ? 2 * textProgress * textProgress : 1 - Math.pow(-2 * textProgress + 2, 2) / 2;
          this.deathText.alpha = easeText;

          // Slight scale pulse effect
          const scale = 1 + Math.sin(textProgress * Math.PI) * 0.05;
          this.deathText.scale.set(scale);
        } else if (elapsed >= textFadeInStart + textFadeInDuration) {
          this.deathText.alpha = 1;
          this.deathText.scale.set(1);
        }

        // Phase 3: Hold and then fade out
        if (elapsed > fadeInDuration + holdDuration) {
          const fadeOutProgress = (elapsed - fadeInDuration - holdDuration) / fadeOutDuration;
          const fadeOut = 1 - fadeOutProgress;
          this.blackOverlay.alpha = Math.max(0, fadeOut);
          this.deathText.alpha = Math.max(0, fadeOut);
        }

        // Continue or complete
        if (elapsed < totalDuration) {
          requestAnimationFrame(animate);
        } else {
          this.scene.visible = false;
          this.blackOverlay.alpha = 0;
          this.deathText.alpha = 0;

          if (this.onComplete) {
            this.onComplete();
          }
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Reset the death screen state
   */
  reset() {
    this.scene.visible = false;
    this.blackOverlay.alpha = 0;
    this.deathText.alpha = 0;
  }
}
