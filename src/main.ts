import { Application, Assets, Sprite, Texture } from 'pixi.js';
import { asset, getButtonPositions } from './utils/utils';



(async () => {

  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ resizeTo: window });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  // Load textures
  await Assets.load([
    'https://pixijs.com/assets/bg_button.jpg',
    'https://pixijs.com/assets/button.png',
    'https://pixijs.com/assets/button_down.png',
    asset('portal_big'),
    asset('volcano_big'),
    asset('peacfulJungle_big'),
    asset('Cindy'),
    asset('Cindy2'),
    asset('Cindy3'),
  ]);

  // Create a background...
  const background = Sprite.from(asset('volcano_big'));
  const backgroundBottomOffset = 200;

  // background.width = app.screen.width;
  background.height = app.screen.height-backgroundBottomOffset;

  // Add background to stage...
  app.stage.addChild(background);

  // Create some textures from an image path
  const textureButton = Texture.from(asset('portal_big'));
  const portalScale = 0.7;
  const buttons = [];
  const backgroundButtons = [
    asset('volcano_big'),
    asset('peacfulJungle_big'),
    asset('stoneScene_big'),
    asset('calmMedow'),
    asset('gearfallRuins'),
  ]

  const buttonPositions =  getButtonPositions(3, app.screen.width, textureButton.width, portalScale, 0.05);

  for (let i = 0; i < buttonPositions.length; i++) {
    const button = new Sprite(textureButton);

    button.anchor.set(0.5);
    button.x = buttonPositions[i].x;
    button.y = buttonPositions[i].y;
    button.scale.set(portalScale);
    // Make the button interactive...
    button.eventMode = 'static';
    button.cursor = 'pointer';

    button
      .on('pointerdown', onButtonDown)
      .on('pointerup', onButtonUp)
      .on('pointerupoutside', onButtonUp)
      .on('pointerover', onButtonOver)
      .on('pointerout', onButtonOut);

    // Add it to the stage
    app.stage.addChild(button);

    // Add button to array
    buttons.push(button);
  }

  const characterTexture = Texture.from(asset('Cindy'));
  const character = new Sprite(characterTexture);
  character.anchor.set(0.5, 1);
  character.x = app.screen.width / 2;
  character.y = app.screen.height-150;
  character.scale.set(2);
  app.stage.addChild(character);
  const jump = (time: number) => {
    const amplitude = 50;
    character.texture = Texture.from(asset('Cindy2'));
    setTimeout(() =>{
      character.y = (app.screen.height-150) - amplitude;
      character.texture = Texture.from(asset('Cindy3'));
    }, time/2);
    setTimeout(() =>{
      character.y = app.screen.height-150;
      character.texture = Texture.from(asset('Cindy'));
    }, time);
  }


  interface ButtonSprite extends Sprite {
    isdown?: boolean;
    isOver?: boolean;
  }
  
  function onButtonDown(this: ButtonSprite) {
    this.isdown = true;
    // this.texture = textureButtonDown;
    this.alpha = 1;
    console.log('Button clicked!');
    setTimeout(() => {
      background.texture = new Texture(Assets.get(asset('peacfulJungle_big')));
    }, 1000);
    jump(1300);

  }

  function onButtonUp(this: ButtonSprite) {
    this.isdown = false;
    if (this.isOver) {
      // this.texture = textureButtonOver;
    } else {
      this.texture = textureButton;
    }
  }

  function onButtonOver(this: ButtonSprite) {
    this.isOver = true;
    if (this.isdown) {
      return;
    }
    // this.texture = textureButtonOver;
  }

  function onButtonOut(this: ButtonSprite) {
    this.isOver = false;
    if (this.isdown) {
      return;
    }
    // this.texture = textureButton;
  }

})();
