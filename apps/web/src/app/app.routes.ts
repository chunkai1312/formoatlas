import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then(
        (m) => m.HomeComponent
      ),
  },
  {
    path: 'market-overview',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'sector-flow',
    loadComponent: () =>
      import('./features/sector-flow/sector-flow.component').then(
        (m) => m.SectorFlowComponent
      ),
  },
  {
    path: 'hot-stocks',
    loadComponent: () =>
      import('./features/hot-stocks/hot-stocks.component').then(
        (m) => m.HotStocksComponent
      ),
  },
  {
    path: 'watchlist',
    loadComponent: () =>
      import('./features/watchlist/watchlist.component').then(
        (m) => m.WatchlistComponent
      ),
  },
  {
    path: 'goal-simulation',
    loadComponent: () =>
      import('./features/goal-simulation/goal-simulation.component').then(
        (m) => m.GoalSimulationComponent
      ),
  },
  {
    path: 'stocks/:symbol',
    loadComponent: () =>
      import('./features/stock-detail/stock-detail.component').then(
        (m) => m.StockDetailComponent
      ),
  },
  { path: '**', redirectTo: '' },
];
