import React, { useState, useEffect } from 'react';
import api from '../services/api';
import FiltroInsumos from '../pages/FiltroInsumos';

const Insumos = () => {
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({
    codigo_insumo: '',
    descricao_do_insumo: '',
    unidade: '',
    classificacao: '',
    origem_de_preco: '',
    estado: ''
  });

  useEffect(() => {
    carregarInsumos();
  }, []);

  const carregarInsumos = async () => {
    try {
      setLoading(true);
      const response = await api.getInsumos();
      
      // Verificar se a resposta tem a propriedade results
      if (response && response.results) {
        setInsumos(response.results);
      } else if (Array.isArray(response)) {
        // Se a resposta for um array, usar diretamente
        setInsumos(response);
      } else {
        // Se não for nem um objeto com results nem um array, usar um array vazio
        console.error('Formato de resposta inesperado:', response);
        setInsumos([]);
      }
      
      setError(null);
    } catch (err) {
      setError('Erro ao carregar insumos. Por favor, tente novamente.');
      console.error('Erro ao carregar insumos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (novosFiltros) => {
    console.log('Filtros atualizados:', novosFiltros);
    setFiltros(novosFiltros);
  };

  const getColunasVisiveis = () => {
    const colunasBase = [
      { key: 'codigo_insumo', label: 'Código' },
      { key: 'descricao_do_insumo', label: 'Descrição' },
      { key: 'unidade', label: 'Unidade' },
      { key: 'classificacao', label: 'Classificação' },
      { key: 'origem_de_preco', label: 'Origem' }
    ];

    if (filtros.estado) {
      return [
        ...colunasBase,
        { key: filtros.estado, label: `Preço ${filtros.estado}` }
      ];
    }

    return colunasBase;
  };

  const filtrarInsumos = (insumos, filtros) => {
    if (!insumos || !Array.isArray(insumos)) {
      console.error('Insumos inválidos para filtrar:', insumos);
      return [];
    }

    return insumos.filter(insumo => {
      if (!insumo) return false;
      
      try {
        // Filtro por código
        const codigoMatch = !filtros.codigo_insumo || 
          (insumo.codigo_insumo && insumo.codigo_insumo.toString().toLowerCase().includes(filtros.codigo_insumo.toLowerCase()));
        
        // Filtro por descrição
        const descricaoMatch = !filtros.descricao_do_insumo || 
          (insumo.descricao_do_insumo && insumo.descricao_do_insumo.toLowerCase().includes(filtros.descricao_do_insumo.toLowerCase()));
        
        // Filtro por unidade
        const unidadeMatch = !filtros.unidade || 
          (insumo.unidade && insumo.unidade.toLowerCase().includes(filtros.unidade.toLowerCase()));
        
        // Filtro por classificação
        const classificacaoMatch = !filtros.classificacao || 
          (insumo.classificacao && insumo.classificacao.toLowerCase().includes(filtros.classificacao.toLowerCase()));
        
        // Filtro por origem - verifica se o valor é exatamente igual
        const origemMatch = !filtros.origem_de_preco || 
          (insumo.origem_de_preco && insumo.origem_de_preco === filtros.origem_de_preco);

        // Filtro por estado - se um estado estiver selecionado, verifica se o insumo tem preço para esse estado
        const estadoMatch = !filtros.estado || 
          (insumo[filtros.estado] !== undefined && insumo[filtros.estado] !== null);

        return codigoMatch && descricaoMatch && unidadeMatch && classificacaoMatch && origemMatch && estadoMatch;
      } catch (err) {
        console.error('Erro ao filtrar insumo:', err, insumo);
        return false;
      }
    });
  };

  if (loading) {
    return <div style={loadingStyle}>Carregando insumos...</div>;
  }

  if (error) {
    return <div style={errorStyle}>{error}</div>;
  }

  const insumosFiltrados = filtrarInsumos(insumos, filtros);
  const colunas = getColunasVisiveis();

  return (
    <div style={containerStyle}>
      <FiltroInsumos onFiltroChange={handleFiltroChange} />
      
      <div style={resultsInfoStyle}>
        {insumosFiltrados.length > 0 ? (
          <p>Mostrando {insumosFiltrados.length} de {insumos.length} insumos</p>
        ) : (
          <p>Nenhum insumo encontrado com os filtros selecionados</p>
        )}
      </div>
      
      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              {colunas.map(coluna => (
                <th key={coluna.key} style={thStyle}>
                  {coluna.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {insumosFiltrados.length > 0 ? (
              insumosFiltrados.map(insumo => (
                <tr key={insumo.codigo_insumo} style={trStyle}>
                  {colunas.map(coluna => (
                    <td key={`${insumo.codigo_insumo}-${coluna.key}`} style={tdStyle}>
                      {coluna.key === filtros.estado && insumo[coluna.key] 
                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(insumo[coluna.key])
                        : insumo[coluna.key] || '-'}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={colunas.length} style={{...tdStyle, textAlign: 'center'}}>
                  Nenhum insumo encontrado com os filtros selecionados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Estilos
const containerStyle = {
  padding: '20px',
  maxWidth: '1200px',
  margin: '0 auto'
};

const tableContainerStyle = {
  overflowX: 'auto',
  backgroundColor: '#fff',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: '800px'
};

const thStyle = {
  backgroundColor: '#f5f5f5',
  padding: '12px 16px',
  textAlign: 'left',
  fontWeight: '600',
  color: '#333',
  borderBottom: '2px solid #e8e8e8'
};

const tdStyle = {
  padding: '12px 16px',
  borderBottom: '1px solid #e8e8e8',
  color: '#666'
};

const trStyle = {
  '&:hover': {
    backgroundColor: '#fafafa'
  }
};

const loadingStyle = {
  textAlign: 'center',
  padding: '20px',
  color: '#666'
};

const errorStyle = {
  textAlign: 'center',
  padding: '20px',
  color: '#ff4d4f',
  backgroundColor: '#fff2f0',
  borderRadius: '4px',
  border: '1px solid #ffccc7'
};

const resultsInfoStyle = {
  marginBottom: '15px',
  color: '#666',
  fontSize: '0.9em'
};

export default Insumos;