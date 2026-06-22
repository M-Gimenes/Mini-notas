// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TemaProvider } from './contexts/TemaContext';
import { LayoutPrincipal } from './components/LayoutPrincipal';
import { ListaNotas } from './pages/ListaNotas';
import { EditorNota } from './pages/EditorNota';
import { Sobre } from './pages/Sobre';
import { NaoEncontrado } from './pages/NaoEncontrado';

export default function App() {
  return (
    <TemaProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<LayoutPrincipal />}>
            <Route index element={<ListaNotas />} />
            <Route path="nova" element={<EditorNota />} />
            <Route path="nota/:id" element={<EditorNota />} />
            <Route path="sobre" element={<Sobre />} />
            <Route path="*" element={<NaoEncontrado />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TemaProvider>
  );
}