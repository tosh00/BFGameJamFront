import { Assets, Container, FederatedPointerEvent, Graphics, Sprite, Texture } from 'pixi.js';
import { asset } from './utils/utils';

export default class Portal {
  position: { x: number; y: number };
  scale: number = 0.8;
  worldId: string;
  scene: Container;
  elements: Sprite[] = [];
  pointerOver = false;
  callbacks = {
    onButtonOver: (event: FederatedPointerEvent) => {},
    onButtonOut: (event: FederatedPointerEvent) => {},
    onButtonDown: (event: FederatedPointerEvent) => {},
    onButtonUp: (event: FederatedPointerEvent) => {},
  };

  constructor(
    position: { x: number; y: number },
    worldId: string,
    onButtonDown?: (event: FederatedPointerEvent) => void,
    onButtonUp?: (event: FederatedPointerEvent) => void,
    onButtonOver?: (event: FederatedPointerEvent) => void,
    onButtonOut?: (event: FederatedPointerEvent) => void,
  ) {
    this.scene = new Container({
      isRenderGroup: true,
    });
    this.position = position;
    this.worldId = worldId;
    this.callbacks.onButtonOver = onButtonOver || (() => {});
    this.callbacks.onButtonOut = onButtonOut || (() => {});
    this.callbacks.onButtonDown = onButtonDown || (() => {});
    this.callbacks.onButtonUp = onButtonUp || (() => {});
  }

  async loadAssets() {
    await Assets.load([
      asset('peacfulJungle_big'),
      asset('stoneScene'),
      asset('gearfallRuins'),
      asset('calmMedow'),
      asset('volcano_big'),
    ]);
  }

  render(app: any) {
    const button = new Sprite(Texture.from(asset('portal_big')));

    button.anchor.set(0.5);
    button.x = this.position.x;
    button.y = this.position.y;
    button.scale.set(this.scale);

    const bgAsset = new Sprite(Texture.from(asset(this.worldId)));
    bgAsset.anchor.set(0.5);
    bgAsset.width = button.width * this.scale;
    bgAsset.height = button.height * this.scale;
    bgAsset.x = button.x;
    bgAsset.y = button.y;
    const ellipseWidth = button.width * this.scale - 60;
    const ellipseHeight = button.height * this.scale;
    const ellipse = new Graphics().ellipse(button.x, button.y, ellipseWidth / 2, ellipseHeight / 2);
    bgAsset.mask = ellipse;
    ellipse.fill(0xffffff);

    // Make the button interactive...
    button.eventMode = 'static';
    button.cursor = 'pointer';

    this.callbacks.onButtonOver = (event: FederatedPointerEvent) => {
      this.pointerOver = true;
      console.log('over portal');
    };
    this.callbacks.onButtonOut = (event: FederatedPointerEvent) => {
      this.pointerOver = false;
      console.log('out portal');
    };

    button
      .on('pointerdown', this.callbacks.onButtonDown)
      .on('pointerup', this.callbacks.onButtonUp)
      .on('pointerupoutside', this.callbacks.onButtonUp)
      .on('pointerover', this.callbacks.onButtonOver)
      .on('pointerout', this.callbacks.onButtonOut);


    this.elements.push(bgAsset, button);
    this.scene.addChild(bgAsset);
    this.scene.addChild(button);
    this.scene.addChild(ellipse);
  }

  addAnimations(app: any) {
    let tick = 0;
    app.ticker.add(() => {
      if (this.scene) {
        if (this.pointerOver) {
          tick++;
          this.scene.rotation = 0.05 * Math.sin(tick / 20);
        } else {
          this.scene.rotation = 0;
          tick = 0;
        }
      }

          this.elements[0].x = 0.05 * Math.sin(tick / 20);

    });
  }
}
