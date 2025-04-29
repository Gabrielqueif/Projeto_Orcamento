import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Insumos from "./pages/insumos";
import BuscaInsumo from "./pages/BuscaInsumo";
import Composicoes from './pages/composicoes';

function App() {
  return (
    <Router>
      <div>
        <nav style={{ 
          padding: '20px', 
          backgroundColor: '#f8f9fa',
          marginBottom: '20px'
        }}>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0, 
            margin: 0,
            display: 'flex',
            gap: '20px'
          }}>
            <li>
              <Link to="/" style={{ textDecoration: 'none', color: '#007bff' }}>
                Lista de Insumos
              </Link>
            </li>
            <li>
              <Link to="/busca" style={{ textDecoration: 'none', color: '#007bff' }}>
                Buscar por Código
              </Link>
            </li>
            <li>
              <Link to="/composicoes" style={{ textDecoration: 'none', color: '#007bff' }}>
                Composições
              </Link>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<Insumos />} />
          <Route path="/busca" element={<BuscaInsumo />} />
          <Route path = "/composicoes" element={<Composicoes />}/>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
