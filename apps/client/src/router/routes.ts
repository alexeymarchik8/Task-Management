import type { ReactElement } from 'react';
import { createElement } from 'react';
import { Dashboard } from '../pages/Dashboard';
import { Register } from '../pages/Register';
import { Login } from '../pages/Login';

export interface AppRoute {
  path: string;
  element: ReactElement;
}

export const protectedRoutes: AppRoute[] = [
  { path: '/dashboard/:projectId', element: createElement(Dashboard) },
];

export const publicRoutes: AppRoute[] = [
  { path: '/register', element: createElement(Register) },
  { path: '/login', element: createElement(Login) },
];
