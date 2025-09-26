import { createBrowserRouter, RouteObject } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { FormsPage } from './pages/FormsPage';

const routes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/forms',
    element: <FormsPage />,
  },
];

export const router = createBrowserRouter(routes);