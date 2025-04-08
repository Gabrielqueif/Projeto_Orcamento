import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Adicionando os métodos diretamente ao objeto api
api.getInsumos = async (page = 1, pageSize = 100) => {
  try {
    const response = await api.get(`/insumos/?page=${page}&page_size=${pageSize}`);
    // Verificar se a resposta tem a propriedade results (formato paginado)
    if (response.data && response.data.results) {
      return response.data;
    }
    // Se não tiver results, retornar os dados diretamente
    return { results: response.data };
  } catch (error) {
    console.error('Erro ao buscar insumos:', error);
    throw error;
  }
};

api.getInsumoPorCodigo = async (codigo) => {
  console.log('API: Buscando insumo com código:', codigo);
  console.log('API: URL completa:', `/insumos/por_codigo/?codigo=${codigo}`);
  
  try {
    const response = await api.get(`/insumos/por_codigo/?codigo=${codigo}`);
    console.log('API: Resposta completa:', response);
    
    // Verificar se a resposta contém dados
    if (response.data) {
      console.log('API: Dados encontrados:', response.data);
      return response.data;
    }
    
    // Se não houver dados, lançar um erro
    console.log('API: Nenhum dado encontrado');
    throw new Error('Insumo não encontrado');
  } catch (error) {
    console.error('API: Erro ao buscar insumo por código:', error);
    
    // Se for um erro 404, retornar uma mensagem amigável
    if (error.response && error.response.status === 404) {
      console.log('API: Erro 404 - Insumo não encontrado');
      throw new Error('Insumo não encontrado');
    }
    
    // Se for um erro de rede ou outro tipo de erro
    if (error.message === 'Network Error') {
      console.log('API: Erro de rede - Verifique se o servidor está rodando');
      throw new Error('Erro de conexão com o servidor. Verifique se o servidor está rodando.');
    }
    
    throw error;
  }
};

// Função de teste para verificar se a rota de busca por código está funcionando
api.testarBuscaPorCodigo = async (codigo) => {
  console.log('API: Testando busca por código:', codigo);
  
  try {
    // Primeiro, vamos verificar se o insumo existe na lista geral
    const todosInsumos = await api.getInsumos();
    console.log('API: Total de insumos:', todosInsumos.results ? todosInsumos.results.length : 0);
    
    // Procurar o insumo na lista geral
    const insumoEncontrado = todosInsumos.results.find(i => i.codigo_insumo === codigo);
    console.log('API: Insumo encontrado na lista geral:', insumoEncontrado ? 'Sim' : 'Não');
    
    // Agora vamos tentar a busca específica
    const response = await api.get(`/insumos/por_codigo/?codigo=${codigo}`);
    console.log('API: Resposta da busca específica:', response);
    
    return {
      insumoExiste: !!insumoEncontrado,
      respostaBusca: response.data
    };
  } catch (error) {
    console.error('API: Erro no teste de busca por código:', error);
    return {
      erro: error.message,
      status: error.response ? error.response.status : 'desconhecido'
    };
  }
};

api.buscarInsumos = async (filtros) => {
  try {
    // Construir a URL com os parâmetros de busca
    let url = '/insumos/buscar/?';
    const params = new URLSearchParams();
    
    if (filtros.classificacao) params.append('classificacao', filtros.classificacao);
    if (filtros.codigo_insumo) params.append('codigo', filtros.codigo_insumo);
    if (filtros.descricao_do_insumo) params.append('descricao', filtros.descricao_do_insumo);
    if (filtros.unidade) params.append('unidade', filtros.unidade);
    if (filtros.origem_de_preco) params.append('origem', filtros.origem_de_preco);
    if (filtros.estado) params.append('estado', filtros.estado);
    
    url += params.toString();
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar insumos com filtros:', error);
    throw error;
  }
};

export default api; 