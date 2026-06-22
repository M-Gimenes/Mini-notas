// src/components/LayoutPrincipal.tsx
import { NavLink, Outlet } from 'react-router-dom';
import { TemaToggle } from './TemaToggle';

export function LayoutPrincipal() {
  return (
    <>
      <nav className="navbar navbar-expand bg-body-tertiary border-bottom">
        <div className="container">
          <NavLink className="navbar-brand fw-bold" to="/">
            Mini Notas
          </NavLink>
          <div className="navbar-nav me-auto">
            <NavLink className="nav-link" to="/" end>
              Notas
            </NavLink>
            <NavLink className="nav-link" to="/sobre">
              Sobre
            </NavLink>
          </div>
          <TemaToggle />
        </div>
      </nav>

      <main className="container py-4">
        <Outlet />
      </main>
    </>
  );
}