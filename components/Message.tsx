import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, MessageAuthor } from '../types';

interface MessageProps {
  message: ChatMessage;
}

const ModelAvatar: React.FC = () => (
    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mr-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.45 4.9-4.9 1.45 4.9 1.45 1.45 4.9 1.45-4.9 4.9-1.45-4.9-1.45z"/>
            <path d="M5 3v4"/>
            <path d="M19 17v4"/>
            <path d="M3 5h4"/>
            <path d="M17 19h4"/>
        </svg>
    </div>
);

const UserAvatar: React.FC = () => (
    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0 ml-3">
        <span className="text-sm font-semibold text-gray-200">VC</span>
    </div>
);


const Message: React.FC<MessageProps> = ({ message }) => {
  const { author, text } = message;
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  }

  const isUserModel = author === MessageAuthor.USER;

  if (author === MessageAuthor.SYSTEM) {
      return (
          <div className="text-center text-xs text-gray-500 py-2">{text}</div>
      );
  }

  return (
    <div className={`flex items-start gap-3 w-full max-w-4xl mx-auto ${isUserModel ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isUserModel && <ModelAvatar />}

        <div className={`flex flex-col w-full group ${isUserModel ? 'items-end' : 'items-start'}`}>
            <div className={`p-4 rounded-2xl max-w-2xl relative ${
                isUserModel 
                ? 'bg-purple-600 text-white rounded-br-none' 
                : 'bg-gray-700/50 text-gray-200 rounded-bl-none'
            }`}>
                <div className="prose prose-sm prose-invert max-w-none prose-p:my-0 prose-pre:bg-gray-800/50 prose-pre:p-3 prose-pre:rounded-lg">
                    {author === MessageAuthor.MODEL ? (
                        <ReactMarkdown>{text}</ReactMarkdown>
                    ) : (
                        <p className="whitespace-pre-wrap">{text}</p>
                    )}
                </div>
            </div>

            {author === MessageAuthor.MODEL && (
                 <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-2 py-1 bg-gray-700/80 hover:bg-gray-600 rounded-md transition-colors"
                    >
                        {copyStatus === 'idle' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        )}
                        <span>{copyStatus === 'idle' ? 'Copiar' : 'Copiado!'}</span>
                    </button>
                 </div>
            )}
        </div>
        
        {isUserModel && <UserAvatar />}
    </div>
  );
};

export default Message;
