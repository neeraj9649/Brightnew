// src/types/wow.js.d.ts
declare module "wow.js" {
  interface WOWOptions {
    boxClass?: string;
    animateClass?: string;
    offset?: number;
    mobile?: boolean;
    live?: boolean;
  }

  class WOW {
    constructor(options?: WOWOptions);
    init(): void;
  }

  export default WOW;
}
