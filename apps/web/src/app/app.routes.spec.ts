import { appRoutes } from './app.routes';

describe('appRoutes', () => {
  it('routes the home page and market overview separately', () => {
    expect(appRoutes.find((route) => route.path === '')).toBeTruthy();
    expect(appRoutes.find((route) => route.path === 'market-overview')).toBeTruthy();
    expect(appRoutes.find((route) => route.path === 'sector-flow')).toBeTruthy();
    expect(appRoutes.find((route) => route.path === 'hot-stocks')).toBeTruthy();
  });
});
