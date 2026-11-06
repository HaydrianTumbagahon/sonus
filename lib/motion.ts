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
