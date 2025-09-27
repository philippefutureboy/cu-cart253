import p5js from 'p5';

if (typeof window !== 'undefined') {
  // Avoid reassigning on HMR
  if (!window.p5) window.p5 = p5js;
}

export default p5js;
