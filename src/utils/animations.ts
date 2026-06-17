// Animation configurations for consistent, smooth animations across the app

export const animationTimings = {
  FAST: 200,      // Quick feedback animations
  NORMAL: 300,    // Standard animations
  SLOW: 500,      // Deliberate, smooth animations
  VERY_SLOW: 800, // Emphasis animations
};

export const animationEasings = {
  EASE_IN_OUT: 'ease-in-out',
  EASE_OUT: 'ease-out',
  EASE_IN: 'ease-in',
  LINEAR: 'linear',
  CUBIC: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Bounce effect
};

export const animations = {
  // Scale animation: grows on tap
  scalePress: {
    from: 1,
    to: 1.05,
    timing: animationTimings.FAST,
  },

  // Fade animation: appears on load
  fadeIn: {
    from: 0,
    to: 1,
    timing: animationTimings.NORMAL,
  },

  // Slide animation: comes up from bottom
  slideUp: {
    from: 30,
    to: 0,
    timing: animationTimings.NORMAL,
  },

  // Bounce animation: elastic feel
  bounce: {
    from: 0,
    to: 1,
    timing: animationTimings.SLOW,
  },

  // Rotate animation: spin effect
  rotate: {
    from: 0,
    to: 360,
    timing: animationTimings.SLOW,
  },

  // Number count animation: animate number increase
  countUp: {
    timing: animationTimings.SLOW,
  },

  // Color transition: smooth color change
  colorTransition: {
    timing: animationTimings.NORMAL,
  },
};

// Reusable animation styles (can be used with Animated API)
export const animationPresets = {
  cardTap: {
    scale: 1.05,
    duration: animationTimings.FAST,
  },

  cardEntry: {
    opacity: 0,
    translateY: 30,
    duration: animationTimings.NORMAL,
  },

  numberBounce: {
    scale: 1.1,
    duration: animationTimings.SLOW,
  },

  smoothColor: {
    duration: animationTimings.NORMAL,
  },
};
