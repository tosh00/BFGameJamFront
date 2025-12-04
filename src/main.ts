import { Application, Assets, Graphics, Sprite, Texture } from 'pixi.js';
import { asset, getButtonPositions } from './utils/utils';
import Character from './character';
import Portal from './portal';
import Terminal from './terminal';
import Menu from './menu';

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ resizeTo: window });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);
  const backgroundButtons = [
    'peacfulJungle_big',
    'volcano_big',
    'stoneScene',
    'gearfallRuins',
    'calmMedow',
  ];
  // Load textures
  await Assets.load([
    'https://pixijs.com/assets/bg_button.jpg',
    'https://pixijs.com/assets/button.png',
    'https://pixijs.com/assets/button_down.png',
    asset('portal_big'),
    asset('volcano_big'),
    asset('platform'),
    asset('Cindy'),
    asset('Cindy2'),
    asset('Cindy3'),
    ...backgroundButtons.map(asset),
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
  
  interface ButtonSprite extends Sprite {
    isdown?: boolean;
    isOver?: boolean;
  }
  for (let i = 0; i < buttonPositions.length; i++) {
    const worldId = backgroundButtons[i % backgroundButtons.length];
    const b = new Portal(
      buttonPositions[i],
      worldId,
      (B)=>{
        makeJump(worldId);

      },
      ()=>{},
      ()=>{console.log("over");},
      ()=>{},
    );
    b.render(app);
    b.loadAssets();
    b.addAnimations(app);
    buttons.push(b);
    app.stage.addChild(b.scene);
  }

  function makeJump(to: string) {
    // this.isdown = true;
    // // this.texture = textureButtonDown;
    // this.alpha = 1;
    console.log('Button clicked!');
    setTimeout(() => {
      background.texture = new Texture(Assets.get(asset(to)));
    }, 1000);
    characterScene.jump(app, backgroundBottomOffset, 100);
  }
  

  //  terminal UI

  const terminal = new Terminal(backgroundBottomOffset, app.screen.height, app.screen.width);
  terminal.render(app);
  app.stage.addChild(terminal.scene);

  // let tick = 0;

  app.ticker.add(() => {
    // Iterate through the sprites and update their position
    // buttons[0].rotation = 0.05 * Math.sin(tick);

    // Update terminal typewriter effect
    terminal.update();

    // Increment the ticker
    // tick += 1;
  });

  // Starting menu
  const menu = new Menu(app.screen.width, app.screen.height, () => {
    menu.destroy();
    // Game is now visible and playable
  });
  app.stage.addChild(menu.scene);

})();
