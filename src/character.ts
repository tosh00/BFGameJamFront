import { Assets, Container, Sprite, Texture } from 'pixi.js';
import { asset } from './utils/utils';

export default class Character {

  character: Sprite;
  platform: Sprite;
  scene: Container;

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

    this.character.eventMode = 'static';
    this.character.cursor = 'pointer';

    this.character.on('pointerover', () => {
      console.log('Character over!');
    });

    this.scene.addChild(this.character);
  }

  jump(app: any, backgroundBottomOffset: number, time: number) {
    // const amplitude = 50;
    // this.character.texture = Texture.from(asset('Cindy2'));
    // setTimeout(() => {
    //   this.character.y =  app.screen.height - backgroundBottomOffset - 80 - amplitude;
    //   this.character.texture = Texture.from(asset('Cindy3'));
    // }, time / 2);
    // setTimeout(() => {
    //   this.character.y =  app.screen.height - backgroundBottomOffset - 80;
    //   this.character.texture = Texture.from(asset('Cindy'));
    // }, time);
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
  };

}
