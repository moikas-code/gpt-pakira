import axios from 'axios';
import {encode, decode} from 'gpt-3-encoder';


import {Tokenizer} from 'gpt-3-encoder';

// Import 'tiktoken' at the top of your gpt3Utils module
export function wrapCodeBlocks(text) {
  const codePattern =
    /((?:[a-zA-Z0-9_$]+\s*\(.*\)\s*\{[\s\S]*?\})|(?:[a-zA-Z0-9_]+\s*=\s*function\s*\(.*\)\s*\{[\s\S]*?\}))/g;
  const mathPattern = /((?:[a-zA-Z]+\s*=.*\n)|(?:[a-zA-Z]+\(.*\) = .*\n))/g;

  const wrappedCode = text.replace(codePattern, (match) => {
    return '```\n' + match + '\n```';
  });

  const wrappedMath = wrappedCode.replace(mathPattern, (match) => {
    return '```\n' + match + '\n```';
  });

  return wrappedMath;
}

export async function handleChatbotResponse(response) {
  return wrapCodeBlocks(response);
}

export const calculateTotalTokens = (messages) => {
  let totalTokens = 0;
  for (const message of messages) {
    const tokens = encode(message.content);
    totalTokens += tokens.length;
  }
  return totalTokens;
};

export function splitTextIntoChunks(text, maxTokens) {
  const chunks = [];
  let currentChunk = '';

  const words = text.split(' ');

  for (const word of words) {
    const currentChunkTokens = encode(currentChunk + ' ' + word).length;

    if (currentChunkTokens <= maxTokens) {
      currentChunk += ' ' + word;
    } else {
      chunks.push(currentChunk.trim());
      currentChunk = word;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}