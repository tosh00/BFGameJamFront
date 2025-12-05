// filepath: /home/bartosz_palewicz/Projects/my-sh/BFGameJamFront/src/character.ts
import { Assets, Container, Sprite, Texture } from 'pixi.js';
import { asset } from './utils/utils';

export default class Character {

  character: Sprite;
  platform: Sprite;
  scene: Container;
  private centerX: number = 0;
  private isShifted: boolean = false;

  constructor() {
    this.scene = new Container({
      isRenderGroup: true,
    });
    this.character = new Sprite(Texture.from(asset('Cindy')));
    this.platform = new Sprite(Texture.from(asset('platform')));
  }

  async loadAssets() {
    await Assets.load([asset('platform'), asset('Cindy'), asset('Cindy2'), asset('Cindy3')]);
  }

  render(app: any, backgroundBottomOffset: number) {
    this.platform = new Sprite(Texture.from(asset('platform')));
    this.platform.anchor.set(0.5, 1);
    this.platform.x = app.screen.width / 2;
    this.platform.y = app.screen.height - backgroundBottomOffset;
    this.platform.scale.set(1.5);
    this.scene.addChild(this.platform);

    const characterTexture = Texture.from(asset('Cindy'));
    this.character = new Sprite(characterTexture);
    this.character.anchor.set(0.5, 1);
    this.character.x = app.screen.width / 2 + 10;
    this.character.y = app.screen.height - backgroundBottomOffset - 80;
    this.character.scale.set(2);

    // Store center position for reset
    this.centerX = this.character.x;

    this.character.eventMode = 'static';
    this.character.cursor = 'pointer';

    this.character.on('pointerover', () => {
      console.log('Character over!');
    });

    this.scene.addChild(this.character);
  }

  jump(app: any, backgroundBottomOffset: number, time: number) {
    let tick = 0;
    const amplitude = 150;
    const jumpDuration = time;

    app.ticker.add(() => {
       if (tick < (jumpDuration/3)) {
        // Jumping up
        this.character.y = app.screen.height - backgroundBottomOffset - 80 - (amplitude * (tick / jumpDuration ));
        this.platform.y = app.screen.height - backgroundBottomOffset + 500 * (tick / jumpDuration );
        this.character.texture = Texture.from(asset('Cindy3'));
      } else if (tick < (jumpDuration*2/3)) {
        // Falling down
        this.character.texture = Texture.from(asset('Cindy2'));
        this.character.y = app.screen.height - backgroundBottomOffset - 80 - (amplitude/3);
      } else if (tick < (jumpDuration)) {
        // Falling down
        this.character.texture = Texture.from(asset('Cindy2'));
        this.character.y = app.screen.height - backgroundBottomOffset - 80 - (amplitude * (1 - (tick / jumpDuration )));
        this.platform.y = app.screen.height - backgroundBottomOffset + 500 * (1 - (tick / jumpDuration ));
      } else {
        // End of jump
        this.character.texture = Texture.from(asset('Cindy'));
        this.character.y = app.screen.height - backgroundBottomOffset - 80;
      }
      tick++;
    });
  }

  /**
   * Shift character to the right side of the screen
   */
  shiftRight(app: any, duration: number = 500): Promise<void> {
    if (this.isShifted) return Promise.resolve();
    
    const targetX = app.screen.width * 0.75;
    const platformTargetX = app.screen.width * 0.75 - 10;
    
    return new Promise((resolve) => {
      const startX = this.character.x;
      const platformStartX = this.platform.x;
      const startTime = performance.now();

      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out for smooth movement
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        this.character.x = startX + (targetX - startX) * easeProgress;
        this.platform.x = platformStartX + (platformTargetX - platformStartX) * easeProgress;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.isShifted = true;
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Shift character back to center
   */
  shiftToCenter(duration: number = 500): Promise<void> {
    if (!this.isShifted) return Promise.resolve();
    
    const targetX = this.centerX;
    const platformTargetX = this.centerX - 10;
    
    return new Promise((resolve) => {
      const startX = this.character.x;
      const platformStartX = this.platform.x;
      const startTime = performance.now();

      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out for smooth movement
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        this.character.x = startX + (targetX - startX) * easeProgress;
        this.platform.x = platformStartX + (platformTargetX - platformStartX) * easeProgress;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.isShifted = false;
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Reset character position to center instantly
   */
  resetPosition() {
    this.character.x = this.centerX;
    this.platform.x = this.centerX - 10;
    this.isShifted = false;
  }
}
