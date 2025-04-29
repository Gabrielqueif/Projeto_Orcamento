import React, {useEffect} from "react";
import api from "../services/api";

const Composicoes = () => {
    const [composicoes, setComposicoes] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [filtros, setFiltros] = React.useState({
        grupo: "",
        codigo_composicao: "",
        tipo_item: "",
        codigo_item: "",
        descricao: "",
        unidade: "",
        coeficiente: ""
    });

    useEffect(() => {
        carregarComposicoes();
    }, []);

    const carregarComposicoes = async () => {
        try {
            setLoading(true);
            const response = await api.getComposicoes();
            if (response && response.results) {
                setComposicoes(response.results);
            } else if (Array.isArray(response)) {
                setComposicoes(response);
            } else {
                console.error("Formato de resposta inesperado:", response);
                setComposicoes([]);
            }
            setError(null);
        } catch (err) {
            setError("Erro ao carregar composições. Por favor, tente novamente.");
            console.error("Erro ao carregar composições:", err);
        } finally {
            setLoading(false);
        }
    };
}