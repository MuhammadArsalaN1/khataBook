import { Dimensions, useWindowDimensions } from 'react-native';

export const screenSize = {
  SMALL: 'small',      // < 500px (old phones)
  MEDIUM: 'medium',    // 500-650px (normal phones, Redmi)
  LARGE: 'large',      // 650-900px (iPhone Pro Max)
  XLARGE: 'xlarge',    // > 900px (tablets, Galaxy Z Fold)
};

export function getScreenSize(): string {
  const { width } = Dimensions.get('window');
  if (width < 500) return screenSize.SMALL;
  if (width < 650) return screenSize.MEDIUM;
  if (width < 900) return screenSize.LARGE;
  return screenSize.XLARGE;
}

export function useResponsiveDimensions() {
  const { width, height } = useWindowDimensions();
  const isSmall = width < 500;
  const isMedium = width >= 500 && width < 650;
  const isLarge = width >= 650 && width < 900;
  const isXLarge = width >= 900;
  const isPortrait = height > width;
  const isLandscape = width > height;

  return {
    width,
    height,
    isSmall,
    isMedium,
    isLarge,
    isXLarge,
    isPortrait,
    isLandscape,
    screenSize: getScreenSize(),
  };
}

// Scale utilities for responsive sizing
export const scaleDP = (size: number): number => {
  const { width } = Dimensions.get('window');
  const baseWidth = 375; // iPhone base width
  return (width / baseWidth) * size;
};

export const responsiveFontSize = (baseFontSize: number): number => {
  const { width } = Dimensions.get('window');
  const baseWidth = 375;
  const maxFontSizeMultiplier = 1.3;
  const multiplier = Math.min((width / baseWidth) * 1.1, maxFontSizeMultiplier);
  return baseFontSize * multiplier;
};

export const responsiveSpacing = (baseSpacing: number): number => {
  const { width } = Dimensions.get('window');
  const multiplier = width / 375;
  return Math.round(baseSpacing * multiplier);
};

export const getGridColumns = (): number => {
  const size = getScreenSize();
  if (size === screenSize.SMALL) return 1;
  if (size === screenSize.MEDIUM) return 1;
  if (size === screenSize.LARGE) return 2;
  return 3; // XLARGE
};

export const getCardWidth = (): number => {
  const { width } = Dimensions.get('window');
  const size = getScreenSize();
  const padding = 32;

  if (size === screenSize.SMALL) return width - padding;
  if (size === screenSize.MEDIUM) return width - padding;
  if (size === screenSize.LARGE) return (width - padding) / 2 - 8;
  return (width - padding) / 3 - 10;
};
