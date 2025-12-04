import { Assets, Sprite, Texture } from 'pixi.js';
import { asset } from './utils/utils';

class Character {

  character: Sprite;
  platform: Sprite;


  constructor() {
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
    app.stage.addChild(this.platform);

    const characterTexture = Texture.from(asset('Cindy'));
    this.character = new Sprite(characterTexture);
    this.character.anchor.set(0.5, 1);
    this.character.x = app.screen.width / 2 + 10;
    this.character.y = app.screen.height - backgroundBottomOffset - 80;
    this.character.scale.set(2);
    app.stage.addChild(this.character);
  }

  jump(app: any, backgroundBottomOffset: number, time: number) {
    const amplitude = 50;
    this.character.texture = Texture.from(asset('Cindy2'));
    setTimeout(() => {
      this.character.y =  app.screen.height - backgroundBottomOffset - 80 - amplitude;
      this.character.texture = Texture.from(asset('Cindy3'));
    }, time / 2);
    setTimeout(() => {
      this.character.y =  app.screen.height - backgroundBottomOffset - 80;
      this.character.texture = Texture.from(asset('Cindy'));
    }, time);
  };
}
