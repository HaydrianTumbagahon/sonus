export const revealEase = [0.22, 1, 0.36, 1] as const;

export const revealTransition = {
  duration: 0.7,
  ease: revealEase,
};

export const revealInitial = {
  opacity: 0,
  y: 24,
  skewY: -2,
};

export const revealAnimate = {
  opacity: 1,
  y: 0,
  skewY: 0,
};

export const revealStagger = 0.1;

export const transitionEase = [0.22, 1, 0.36, 1] as const;
export const exitDuration = 0.28;
export const enterDuration = 0.55;
export const introStagger = 0.07;
export const introDelay = 0.12;
export const blurAmount = 12;
export const riseAmount = 14;
