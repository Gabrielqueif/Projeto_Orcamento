import React, { useState, useEffect } from 'react';
import api from '../services/api';

const BuscaInsumo = () => {
  const [codigo, setCodigo] = useState('');
  const [insumo, setInsumo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('BuscaInsumo component mounted');
    return () => {
      console.log('BuscaInsumo component unmounted');
    };
  }, []);

  const limparBusca = () => {
    setCodigo('');
    setInsumo(null);
    setError(null);
  };

  const validarCodigo = (codigo) => {
    if (!codigo.trim()) {
      return 'Por favor, digite um código';
    }
    if (!/^\d+$/.test(codigo)) {
      return 'O código deve conter apenas números';
    }
    return null;
  };

  const handleBusca = async (e) => {
    e.preventDefault();
    console.log('Iniciando busca com código:', codigo);
    
    const erroValidacao = validarCodigo(codigo);
    if (erroValidacao) {
      setError(erroValidacao);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setInsumo(null);
      
      console.log('Chamando API para buscar insumo com código:', codigo);
      const data = await api.getInsumoPorCodigo(codigo);
      console.log('Resposta da API:', data);
      
      if (!data) {
        console.log('Nenhum dado retornado da API');
        setError('Insumo não encontrado');
        return;
      }
      
      setInsumo(data);
    } catch (err) {
      console.error('Erro detalhado na busca:', err);
      setError(err.message || 'Erro ao buscar insumo');
      setInsumo(null);
    } finally {
      setLoading(false);
    }
  };

  const formatarPreco = (valor) => {
    if (!valor) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>Buscar Insumo por Código</h1>
      
      <form onSubmit={handleBusca} style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Digite o código do insumo"
            style={{ 
              padding: '12px',
              fontSize: '16px',
              flex: 1,
              borderRadius: '4px',
              border: '1px solid #ccc',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          />
          <button 
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
          <button 
            type="button"
            onClick={limparBusca}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            Limpar
          </button>
        </div>
      </form>

      {error && (
        <div style={{ 
          color: 'white', 
          backgroundColor: '#dc3545',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          {error}
        </div>
      )}

      {insumo && (
        <div style={{ 
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '20px',
          backgroundColor: '#f9f9f9',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#333', marginBottom: '20px' }}>Detalhes do Insumo</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '15px',
            marginBottom: '20px'
          }}>
            <div>
              <strong>Classificação:</strong> {insumo.classificacao || 'N/A'}
            </div>
            <div>
              <strong>Código:</strong> {insumo.codigo_insumo || 'N/A'}
            </div>
            <div>
              <strong>Descrição:</strong> {insumo.descricao_do_insumo || 'N/A'}
            </div>
            <div>
              <strong>Unidade:</strong> {insumo.unidade || 'N/A'}
            </div>
            <div>
              <strong>Origem de Preço:</strong> {insumo.origem_de_preco || 'N/A'}
            </div>
          </div>

          <h3 style={{ color: '#333', marginBottom: '15px' }}>Preços por Estado</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '10px'
          }}>
            {Object.entries(insumo)
              .filter(([key]) => ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
                                'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
                                'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].includes(key))
              .map(([estado, valor]) => (
                <div key={estado} style={{ 
                  padding: '12px',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <strong style={{ color: '#333', marginBottom: '5px' }}>{estado}</strong>
                  <span style={{ color: valor ? '#28a745' : '#6c757d' }}>
                    {formatarPreco(valor)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BuscaInsumo; 