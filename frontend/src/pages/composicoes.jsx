import React, {useState} from "react";
import api from "../services/api";

const Composicoes = ({composicoes, onComposicaoClick}) => {
    const [selectedComposicao, setSelectedComposicao] = useState(null);
    
    const handleComposicaoClick = (composicao) => {
        setSelectedComposicao(composicao);
        onComposicaoClick(composicao);
    };
    
    return (
        <div className="composicoes-lista">
        {composicoes.map((composicao) => (
            <div
            key={composicao.codigo_composicao}
            className={`composicao-item ${
                selectedComposicao === composicao ? "selected" : ""
            }`}
            onClick={() => handleComposicaoClick(composicao)}
            >
            {composicao.descricao_composicao}
            </div>
        ))}
        </div>
    );
}

export default Composicoes