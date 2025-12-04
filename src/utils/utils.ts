export const asset = (name: string) => {
  return `https://raw.githubusercontent.com/tosh00/BFGameJamFrontAssets/refs/heads/main/${name}.png`
}

export const getButtonPositions = (number: number, screenWidth:number, spriteWidth:number, spriteScale: number, offsetsPercentage: number) => {
  const buttonPositions = [];
  const screenTrueWidth = screenWidth - (screenWidth*offsetsPercentage*2);
  const spacing = screenTrueWidth / number-1;
  for(let i = 0; i < number; i++) {
    const y = 100 + ((i+1)%2 * 150);
    // const y = 100
    const x = i*spacing +spacing/2 + (screenWidth*offsetsPercentage) ;
    console.log("x:", x, " y:", y);
    buttonPositions.push({x, y});
  }
  return buttonPositions;
}
