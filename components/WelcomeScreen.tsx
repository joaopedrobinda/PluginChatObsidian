import React from 'react';

interface WelcomeScreenProps {
  onCardClick?: (prompt: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onCardClick }) => {
    const cards = [
        { title: "Resumir uma nota", description: "Peça um resumo de uma nota longa anexada.", prompt: "Resuma a nota anexada em 3 pontos principais." },
        { title: "Criar um plano de ação", description: "Use suas notas de projeto para gerar os próximos passos.", prompt: "Com base nas notas do projeto, crie um plano de ação para a próxima semana." },
        { title: "Explicar um conceito", description: "Anexe uma nota e peça uma explicação simples.", prompt: "Explique o conceito principal da nota anexada como se eu tivesse 5 anos." },
        { title: "Brainstorm de ideias", description: "Combine ideias de várias notas para gerar novas perspectivas.", prompt: "Combine as ideias das notas anexadas e sugira 3 novos tópicos para explorar." },
    ];
    
    // O handler de clique é opcional, mas se for fornecido, deve ser chamado.
    const handleCardClick = (prompt: string) => {
        if (onCardClick) {
            onCardClick(prompt);
        }
    };

    return (
        <div className="flex flex-col items-start justify-end h-full p-8 text-left animate-fade-in">
            <h1 className="text-5xl font-bold mb-8">
                <span className="bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                    Olá!
                </span>
                <br />
                <span className="text-gray-400">Como posso ajudar hoje?</span>
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {cards.map((card, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleCardClick(card.prompt)}
                      className="p-4 bg-[var(--surface-color)] hover:bg-gray-700 rounded-xl text-left transition-colors duration-200"
                    >
                        <h3 className="font-semibold text-[var(--text-primary)]">{card.title}</h3>
                        <p className="text-sm text-[var(--text-secondary)]">{card.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default WelcomeScreen;
