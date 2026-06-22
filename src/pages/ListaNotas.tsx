// src/pages/ListaNotas.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { listarNotas } from '../api/notas';
import { useApi } from '../hooks/useApi';
import { useDebounce } from '../hooks/useDebounce';
import { NotaCartao } from '../components/NotaCartao';
import { EstadoCarregando } from '../components/EstadoCarregando';
import { EstadoErro } from '../components/EstadoErro';

export function ListaNotas() {
    const [busca, setBusca] = useState('');
    const buscaAtrasada = useDebounce(busca, 400);

    // A cada novo termo (após debounce), o useApi dispara uma requisição
    // e CANCELA a anterior automaticamente.
    const { dados: notas, carregando, erro, recarregar } = useApi(
        (sinal) => listarNotas(buscaAtrasada, sinal),
        [buscaAtrasada]
    );

    function pickTag(tag: string) {
        setBusca(tag);
    }

    return (
        <section>
            <div className="d-flex gap-2 mb-4">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar notas..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                />
                <button
                    type="button"
                    className="btn btn-outline-secondary"
                    hidden={busca.trim().length === 0}
                    onClick={() => setBusca('')}
                >
                    X
                </button>
                <Link to="/nova" className="btn btn-primary text-nowrap">
                    + Nova nota
                </Link>
            </div>

            <div className="mb-3">
                {notas && (
                    <span className="text-secondary">
                        {notas.length} {notas.length === 1 ? 'nota' : 'notas'}
                    </span>
                )}
            </div>

            {carregando && <EstadoCarregando mensagem="Carregando notas..." />}

            {erro && <EstadoErro mensagem={erro} aoTentarDeNovo={recarregar} />}

            {!carregando && !erro && notas && notas.length === 0 && (
                <p className="text-secondary">Nenhuma nota encontrada.</p>
            )}

            {!carregando && !erro && notas && notas.length > 0 && (
                <div className="row g-3">
                    {notas.map((n) => (
                        <div className="col-12 col-sm-6 col-lg-4" key={n.id}>
                            <NotaCartao nota={n} pickTag={pickTag} />
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}