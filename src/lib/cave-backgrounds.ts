// Utility for managing cave background images
// This can be expanded later to allow custom background selection

export const caveBackgrounds = {
  default: '/src/assets/cave-background.jpg',
  // Add more backgrounds here in the future
  crystal: '/src/assets/crystal-cave.jpg',
  dark: '/src/assets/cave-empty.jpg',
} as const;

export type CaveBackgroundType = keyof typeof caveBackgrounds;

export const setCaveBackground = (backgroundType: CaveBackgroundType = 'default') => {
  document.documentElement.style.setProperty(
    '--cave-bg-image', 
    `url('${caveBackgrounds[backgroundType]}')`
  );
};

// Initialize with default background
setCaveBackground();