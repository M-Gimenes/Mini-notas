// src/pages/EditorNota.tsx
import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    obterNota,
    criarNota,
    atualizarNota,
    excluirNota,
} from '../api/notas';
import { useApi } from '../hooks/useApi';
import { EstadoCarregando } from '../components/EstadoCarregando';
import { EstadoErro } from '../components/EstadoErro';
import type { NotaPayload } from '../types/Nota';

export function EditorNota() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const editando = Boolean(id);

    // Em modo edição, carrega a nota do servidor. Em modo criação, resolve com null.
    const { dados: nota, carregando, erro } = useApi(
        (sinal) => (id ? obterNota(id, sinal) : Promise.resolve(null)),
        [id]
    );

    // Estado do formulário (componentes controlados — M05).
    const [titulo, setTitulo] = useState('');
    const [conteudo, setConteudo] = useState('');
    const [tagsTexto, setTagsTexto] = useState('');

    // Estado das operações de escrita (salvar/excluir).
    const [salvando, setSalvando] = useState(false);
    const [erroSalvar, setErroSalvar] = useState<string | null>(null);

    // Quando a nota chega do servidor, preenche o formulário.
    useEffect(() => {
        if (nota) {
            setTitulo(nota.titulo);
            setConteudo(nota.conteudo);
            setTagsTexto((nota.tags ?? []).join(', ')); // tags pode não existir em notas de exemplo
        }
    }, [nota]);

    async function salvar(e: FormEvent) {
        e.preventDefault();
        setSalvando(true);
        setErroSalvar(null);

        const agora = new Date().toISOString();
        const tags = tagsTexto
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);

        try {
            if (editando && id && nota) {
                const payload: NotaPayload = {
                    titulo,
                    conteudo,
                    tags,
                    criadaEm: nota.criadaEm, // preserva a data de criação original
                    atualizadaEm: agora,
                };
                await atualizarNota(id, payload);
            } else {
                const payload: NotaPayload = {
                    titulo,
                    conteudo,
                    tags,
                    criadaEm: agora,
                    atualizadaEm: agora,
                };
                await criarNota(payload);
            }
            navigate('/');
        } catch (err) {
            setErroSalvar((err as Error).message);
            setSalvando(false);
        }
    }

    async function remover() {
        if (!id) return;
        if (!confirm('Excluir esta nota? Esta ação não pode ser desfeita.')) return;

        setSalvando(true);
        setErroSalvar(null);
        try {
            await excluirNota(id);
            navigate('/');
        } catch (err) {
            setErroSalvar((err as Error).message);
            setSalvando(false);
        }
    }

    // Estados de carregamento/erro só importam no modo edição.
    if (editando && carregando) {
        return <EstadoCarregando mensagem="Carregando nota..." />;
    }
    if (editando && erro) {
        return <EstadoErro mensagem={erro} />;
    }

    return (
        <form onSubmit={salvar} className="vstack gap-3" style={{ maxWidth: 640 }}>
            <h2 className="h4">{editando ? 'Editar nota' : 'Nova nota'}</h2>

            <div>
                <label className="form-label">Título</label>
                <input
                    className="form-control"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Título da nota"
                />
                <label className="text-danger form-text" hidden={titulo.trim().length > 0}>
                    O título é obrigatório.
                </label>
            </div>

            <div>
                <label className="form-label">Conteúdo</label>
                <textarea
                    className="form-control"
                    rows={10}
                    value={conteudo}
                    onChange={(e) => setConteudo(e.target.value)}
                    placeholder="Escreva sua nota..."
                />
            </div>

            <div>
                <label className="form-label">Tags (separadas por vírgula)</label>
                <input
                    className="form-control"
                    value={tagsTexto}
                    onChange={(e) => setTagsTexto(e.target.value)}
                    placeholder="react, estudos, importante"
                />
            </div>

            {erroSalvar && <EstadoErro mensagem={erroSalvar} />}

            <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary" disabled={salvando || titulo.trim().length === 0}>
                    {salvando ? 'Salvando...' : editando ? 'Salvar' : 'Criar'}
                </button>
                {editando && (
                    <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={remover}
                        disabled={salvando}
                    >
                        Excluir
                    </button>
                )}
                <button
                    type="button"
                    className="btn btn-link"
                    onClick={() => navigate('/')}
                    disabled={salvando}
                >
                    Cancelar
                </button>
            </div>
        </form>
    );
}