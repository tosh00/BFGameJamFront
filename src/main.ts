import { Application, Assets, Graphics, Sprite, Texture } from 'pixi.js';
import { asset, getButtonPositions } from './utils/utils';
import Character from './character';
import Portal from './portal';

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ resizeTo: window });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);
  const backgroundButtons = [
    asset('peacfulJungle_big'),
    asset('stoneScene'),
    asset('gearfallRuins'),
    asset('calmMedow'),
    asset('volcano_big'),
  ];
  // Load textures
  await Assets.load([
    'https://pixijs.com/assets/bg_button.jpg',
    'https://pixijs.com/assets/button.png',
    'https://pixijs.com/assets/button_down.png',
    asset('portal_big'),
    asset('volcano_big'),
    asset('peacfulJungle_big'),
    asset('platform'),
    asset('Cindy'),
    asset('Cindy2'),
    asset('Cindy3'),
    ...backgroundButtons,
  ]);

  // Create a background...
  const background = Sprite.from(asset('volcano_big'));
  const backgroundBottomOffset = 200;

  // background.width = app.screen.width;
  background.height = app.screen.height - backgroundBottomOffset;

  // Add background to stage...
  app.stage.addChild(background);

  // Create some textures from an image path
  const textureButton = Texture.from(asset('portal_big'));
  const portalScale = 0.9;
  const buttons: Portal[] = [];

  const buttonPositions = getButtonPositions(3, app.screen.width, textureButton.width, portalScale, 0.05);

  const characterScene = new Character();
  characterScene.render(app, backgroundBottomOffset);
  app.stage.addChild(characterScene.scene);

  for (let i = 0; i < buttonPositions.length; i++) {
    const b = new Portal(
      getButtonPositions(3, app.screen.width, textureButton.width, portalScale, 0.05)[i],
      backgroundButtons[i % backgroundButtons.length],
      () => {
        characterScene.jump(app, backgroundBottomOffset, 130);
      }
    );
    b.render(app);
    b.loadAssets();
    b.addAnimations(app);
    buttons.push(b);
    app.stage.addChild(b.scene);
  }

  let tick = 0;

  app.ticker.add(() => {
    // Iterate through the sprites and update their position
    // buttons[0].rotation = 0.05 * Math.sin(tick);

    // Increment the ticker
    tick += 0.1;
  });
})();
