import React, { useState } from 'react';

const FiltroInsumos = ({ onFiltroChange }) => {
  const [filtros, setFiltros] = useState({
    codigo_insumo: '',
    descricao_do_insumo: '',
    unidade: '',
    classificacao: '',
    origem_de_preco: '',
    estado: ''
  });

  const estados = [
    { sigla: '', nome: 'Todos' },
    { sigla: 'AC', nome: 'Acre' },
    { sigla: 'AL', nome: 'Alagoas' },
    { sigla: 'AP', nome: 'Amapá' },
    { sigla: 'AM', nome: 'Amazonas' },
    { sigla: 'BA', nome: 'Bahia' },
    { sigla: 'CE', nome: 'Ceará' },
    { sigla: 'DF', nome: 'Distrito Federal' },
    { sigla: 'ES', nome: 'Espírito Santo' },
    { sigla: 'GO', nome: 'Goiás' },
    { sigla: 'MA', nome: 'Maranhão' },
    { sigla: 'MT', nome: 'Mato Grosso' },
    { sigla: 'MS', nome: 'Mato Grosso do Sul' },
    { sigla: 'MG', nome: 'Minas Gerais' },
    { sigla: 'PA', nome: 'Pará' },
    { sigla: 'PB', nome: 'Paraíba' },
    { sigla: 'PR', nome: 'Paraná' },
    { sigla: 'PE', nome: 'Pernambuco' },
    { sigla: 'PI', nome: 'Piauí' },
    { sigla: 'RJ', nome: 'Rio de Janeiro' },
    { sigla: 'RN', nome: 'Rio Grande do Norte' },
    { sigla: 'RS', nome: 'Rio Grande do Sul' },
    { sigla: 'RO', nome: 'Rondônia' },
    { sigla: 'RR', nome: 'Roraima' },
    { sigla: 'SC', nome: 'Santa Catarina' },
    { sigla: 'SP', nome: 'São Paulo' },
    { sigla: 'SE', nome: 'Sergipe' },
    { sigla: 'TO', nome: 'Tocantins' }
  ];

  const origens = [
    { valor: '', label: 'Todas' },
    { valor: 'C', label: 'C' },
    { valor: 'CR', label: 'CR' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    const novosFiltros = { ...filtros, [name]: value };
    setFiltros(novosFiltros);
    onFiltroChange(novosFiltros);
  };

  const limparFiltros = () => {
    const filtrosLimpos = {
      codigo_insumo: '',
      descricao_do_insumo: '',
      unidade: '',
      classificacao: '',
      origem_de_preco: '',
      estado: ''
    };
    setFiltros(filtrosLimpos);
    onFiltroChange(filtrosLimpos);
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>Filtros</h2>
        <button 
          onClick={limparFiltros}
          style={buttonStyle}
        >
          Limpar Filtros
        </button>
      </div>
      <div style={gridStyle}>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Código:</label>
          <input
            type="text"
            name="codigo_insumo"
            value={filtros.codigo_insumo}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Digite o código"
          />
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Descrição:</label>
          <input
            type="text"
            name="descricao_do_insumo"
            value={filtros.descricao_do_insumo}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Digite a descrição"
          />
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Unidade:</label>
          <input
            type="text"
            name="unidade"
            value={filtros.unidade}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Digite a unidade"
          />
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Classificação:</label>
          <input
            type="text"
            name="classificacao"
            value={filtros.classificacao}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Digite a classificação"
          />
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Origem:</label>
          <select
            name="origem_de_preco"
            value={filtros.origem_de_preco}
            onChange={handleChange}
            style={selectStyle}
          >
            <option value="">Todas</option>
            <option value="C">C</option>
            <option value="CR">CR</option>
          </select>
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Estado:</label>
          <select
            name="estado"
            value={filtros.estado}
            onChange={handleChange}
            style={selectStyle}
          >
            {estados.map(estado => (
              <option key={estado.sigla} value={estado.sigla}>
                {estado.nome}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

// Estilos
const containerStyle = {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  marginBottom: '20px'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px'
};

const titleStyle = {
  margin: '0',
  color: '#333',
  fontSize: '1.5em'
};

const buttonStyle = {
  padding: '8px 16px',
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.9em',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '20px'
};

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const labelStyle = {
  fontSize: '0.9em',
  color: '#666',
  fontWeight: '500'
};

const inputStyle = {
  padding: '8px 12px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '1em',
  '&:focus': {
    outline: 'none',
    borderColor: '#1890ff',
    boxShadow: '0 0 0 2px rgba(24,144,255,0.2)'
  }
};

const selectStyle = {
  ...inputStyle,
  backgroundColor: '#fff',
  cursor: 'pointer'
};

export default FiltroInsumos; 