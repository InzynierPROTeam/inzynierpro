// jsdom setup shared by every ui test: React `act` support and a light-scheme media query.
Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true, configurable: true })

window.matchMedia = query => ({
  matches: false,
  media: query,
  onchange: null,
  // oxlint-disable-next-line typescript/no-deprecated -- Required legacy member of the MediaQueryList test double.
  addListener() {},
  // oxlint-disable-next-line typescript/no-deprecated -- Required legacy member of the MediaQueryList test double.
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => true,
})
