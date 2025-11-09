
import React, { useState } from 'react';
import { ChatMessage, MessageAuthor } from '../types';

interface MessageProps {
  message: ChatMessage;
  onInsert?: () => void;
}

const Message: React.FC<MessageProps> = ({ message, onInsert }) => {
  const { author, text } = message;
  const [copied, setCopied] = useState(false);

  const baseClasses = 'max-w-xl p-3 rounded-lg';
  
  const getAuthorName = () => {
      switch(author) {
          case MessageAuthor.USER: return 'Você';
          case MessageAuthor.MODEL: return 'Gemini';
          case MessageAuthor.SYSTEM: return 'Sistema';
      }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const getContainerClasses = () => {
    switch (author) {
      case MessageAuthor.USER:
        return 'flex justify-end';
      case MessageAuthor.MODEL:
        return 'flex justify-start';
      case MessageAuthor.SYSTEM:
        return 'flex justify-center';
    }
  };

  const getMessageClasses = () => {
    switch (author) {
      case MessageAuthor.USER:
        return `${baseClasses} bg-purple-600 text-white`;
      case MessageAuthor.MODEL:
        return `${baseClasses} bg-gray-700 text-gray-200`;
      case MessageAuthor.SYSTEM:
        return `${baseClasses} bg-gray-600 text-gray-300 text-sm italic w-full text-center`;
    }
  };

  return (
    <div className={getContainerClasses()}>
      <div className="flex flex-col w-full">
        { author !== MessageAuthor.SYSTEM && <span className={`text-xs text-gray-400 mb-1 ${author === MessageAuthor.USER ? 'text-right' : 'text-left'}`}>{getAuthorName()}</span> }
        <div className={getMessageClasses()}>
          <p className="whitespace-pre-wrap">{text}</p>
        </div>
        {author === MessageAuthor.MODEL && (
          <div className={`flex items-center mt-2 space-x-2 ${getContainerClasses().includes('end') ? 'justify-end' : 'justify-start'}`}>
            <button onClick={handleCopy} className="text-xs text-gray-400 hover:text-white px-2 py-1 bg-gray-600 rounded">
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
            {onInsert && (
              <button onClick={onInsert} className="text-xs text-gray-400 hover:text-white px-2 py-1 bg-gray-600 rounded">
                Inserir na Nota
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
