import { createBrowserRouter } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { App } from './App';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/app/*',
    element: <App />,
  },
] as RouteObject[]);