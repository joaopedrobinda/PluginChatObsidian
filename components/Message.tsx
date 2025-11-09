
import React from 'react';
import { ChatMessage, MessageAuthor } from '../types';

interface MessageProps {
  message: ChatMessage;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const { author, text } = message;

  const baseClasses = 'max-w-xl p-3 rounded-lg';
  
  const getAuthorName = () => {
      switch(author) {
          case MessageAuthor.USER: return 'Você';
          case MessageAuthor.MODEL: return 'Gemini';
          case MessageAuthor.SYSTEM: return 'Sistema';
      }
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
      <div className="flex flex-col">
        { author !== MessageAuthor.SYSTEM && <span className={`text-xs text-gray-400 mb-1 ${author === MessageAuthor.USER ? 'text-right' : 'text-left'}`}>{getAuthorName()}</span> }
        <div className={getMessageClasses()}>
          <p className="whitespace-pre-wrap">{text}</p>
        </div>
      </div>
    </div>
  );
};

export default Message;
