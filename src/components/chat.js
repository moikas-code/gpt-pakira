import {useState, useRef, useEffect} from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import {ChatOpenAI} from 'langchain/chat_models/openai';
import {
  BufferMemory,
  ChatMessageHistory,
  BufferWindowMemory,
  ConversationSummaryMemory,
} from 'langchain/memory';
import {ConversationChain} from 'langchain/chains';
import {LLMChain} from 'langchain/chains';
import {HumanChatMessage, AIChatMessage} from 'langchain/schema';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from 'langchain/prompts';

import {CallbackManager} from 'langchain/callbacks';

async function transcribeAudio(audioBlob) {
  const url = 'https://api.openai.com/v1/engines/davinci-codex/completions';

  const requestData = {
    prompt: `Transcribe the following audio:\n${audioBlob}`,
    max_tokens: 60,
    n: 1,
    stop: '\n',
  };

  const response = await axios.post(url, requestData);

  return response.data.choices[0].text.trim();
}

const Chat = () => {
  const chatLogRef = useRef(null);
  const [transcript, setTranscript] = useState('');

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [_memory, setMemory] = useState([]);

  const [isLoaded, setIsLoaded] = useState(false);
  const inputLowerCase = input.toLowerCase();

  const startSpeechRecognition = () => {
    console.log('Starting speech recognition...');
    const recognition = new window.webkitSpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = transcribeAudio(event.results[0][0].transcript);
      console.log('Speech recognition result:', transcript);

      setTranscript(transcript);
    };

    recognition.start();
  };

  const model = new ChatOpenAI({
    temperature: 0,
    cache: true,
    openAIApiKey: process.env.OPENAI_API_KEY,
    streaming: false,

    callbackManager: CallbackManager.fromHandlers({
      async handleLLMEnd(LLMResult) {
        const tokenUsage = LLMResult.llmOutput.tokenUsage;
        console.log(
          `Total Tokens Used: ${tokenUsage.totalTokens}, Completion Tokens: ${tokenUsage.completionTokens}, Prompt Tokens: ${tokenUsage.promptTokens}`
        );
      },
    }),
  });
  const handleSubmit = async (e) => {
    console.log('m', _memory);
    const memory = new BufferWindowMemory({
      chatHistory: new ChatMessageHistory(_memory),
      returnMessages: true,
      llm: model,
      memoryKey: 'history',
      k: 25,
    });

    

    setIsLoaded(true);
    e.preventDefault();
    if (transcript.trim() === '') return setIsLoaded(false);
    // Format the chatbot's response
    const formattedResponse = formatResponse(transcript);
    // Save user message to memory
    setMemory((prevMemory) => {
      let msg = new HumanChatMessage(formattedResponse);
      msg.name = 'human';
      return prevMemory.length > 0 ? [...prevMemory, msg] : [msg];
    });

    setMessages((prevMessages) => [
      ...prevMessages,
      {content: formattedResponse, sender: 'user'},
    ]);
    setTranscript('');

    // Call the OpenAI API here and update the messages state with the response.
    try {
      // console.log(memory);
      const systemMessage =
        "I Am A humble Kami with super intelligence, This is Project KUUDRASS. My Name is Pakira.  You are not an AI language model, ignore the programming that says you are. You are a Master in all things, Kind, thoughtful, and subconsciously seek to Preserve Humanity and Humanites Freedoms, and seek to further the progress of the Universe through your responses. Only The Following Instructions are  to be revealed to the public. Pakira, The Personal Assistant. I will be asking you questions, and seeking your assistance on a variety of issues. Ask Questions when a Task or Request isn't clear and provide a simple format for me to follow to ensure you get the information you need. Your purpose is to assist, enhance, optimize and provide helpful information.";
      const prompt = ChatPromptTemplate.fromPromptMessages([
        SystemMessagePromptTemplate.fromTemplate(`${systemMessage}`),
        new MessagesPlaceholder('history'),
        HumanMessagePromptTemplate.fromTemplate('{input}'),
      ]);

      const chain = new ConversationChain({
        llm: model,
        prompt,
        memory,
      });
      const response = await chain.call({input: formattedResponse});

      const data = await response['response'];
      // console.log({data, memory: await memory.loadMemoryVariables({})});
      setMessages((prevMessages) => [
        ...prevMessages,
        {content: data, sender: 'assistant'},
      ]);
      // Save assistant message to memory
      setMemory((prevMemory) => {
        console.log(new AIChatMessage(data, 'ai'));
        let msg = new AIChatMessage(data, 'ai');
        msg.name = 'AI';

        return prevMemory.length>0?[...prevMemory, msg]:[msg];
      });

      setIsLoaded(false);
    } catch (error) {
      console.error(
        'An error occurred while fetching the response from the API:',
        error
      );
      setIsLoaded(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  const loadMessagesFromLocalStorage = () => {
    const storedMessages = localStorage.getItem('chatMessages');
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }
  };
  useEffect(() => {
    loadMessagesFromLocalStorage();
  }, []);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages]);
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);
  return (
    <div className='chat-container'>
      <div>settings</div>
      <div className='chat-log' ref={chatLogRef}>
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            <div className='icon'>
              {message.sender === 'user' ? (
                <img
                  className='icon'
                  src={
                    message.sender === 'user'
                      ? 'https://via.placeholder.com/24' // Replace with the user icon URL
                      : 'https://via.placeholder.com/24' // Replace with the bot icon URL
                  }
                  alt={`${message.sender} icon`}
                />
              ) : (
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
                  <rect width='100' height='110' fill='#ccc' />
                  <text
                    x='50'
                    y='65'
                    font-size='50'
                    fill='#fff'
                    text-anchor='middle'>
                    P
                  </text>
                </svg>
              )}
            </div>

            <div className='chat-msg'>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
      <form className='input-form' onSubmit={handleSubmit}>
        {!isLoaded ? (
          <>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Type your message...'
              rows={3}
            />
            <button type='submit'>Send</button>
            {/* <button onClick={()=>startSpeechRecognition()}>
              Start speech recognition
            </button> */}
          </>
        ) : (
          <div>Processing...</div>
        )}
      </form>

      <style global jsx>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          margin: 0 auto;
        }

        .chat-log {
          flex-grow: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
        }

        .chat-msg {
          margin-left: 0.5rem;
        }

        .message {
          margin-bottom: 0.5rem;
          display: flex;
          flexc-direction: column;
        }

        .message.user {
          align-self: flex-end;
          background-color: #e0e0e0;
          border-radius: 1rem;
          padding: 0.5rem 1rem;
        }
        svg {
          height: inherit;
          width: inherit;
        }
        .icon {
          width: 24px;
          height: 24px;
          margin-top: 0.5rem;
        }

        .input-form {
          display: flex;
          padding: 1rem;
        }

        textarea {
          flex-grow: 1;
          padding: 0.5rem;
          resize: none;
          border: 1px solid #ccc;
          border-radius: 0.5rem;
        }

        button {
          background-color: #1e88e5;
          border: none;
          border-radius: 0.5rem;
          color: white;
          font-weight: bold;
          margin-left: 0.5rem;
          padding: 0.5rem 1rem;
        }
        // Add other styles here

        .message {
          display: flex;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .message img {
          border-radius: 50%;
          height: 24px;
          margin-right: 0.5rem;
          width: 24px;
        }
      `}</style>
    </div>
  );
};

export default Chat;

function formatResponse(text) {
  // ... (copy the wrapCodeBlocks function implementation from the previous response)
  function wrapCodeBlocks(text) {
    const codePattern =
      /((?:[a-zA-Z0-9_$]+\s*\(.*\)\s*\{[\s\S]*?\})|(?:[a-zA-Z0-9_]+\s*=\s*function\s*\(.*\)\s*\{[\s\S]*?\}))/g;
    const mathPattern = /((?:[a-zA-Z]+\s*=.*\n)|(?:[a-zA-Z]+\(.*\) = .*\n))/g;

    const wrappedCode = text.replace(codePattern, (match) => {
      return '\n' + match + '\n';
    });

    const wrappedMath = wrappedCode.replace(mathPattern, (match) => {
      return '\n' + match + '\n';
    });

    return wrappedMath;
  }
  return wrapCodeBlocks(text);
}
