import {useState, useRef, useEffect} from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import {ChatOpenAI} from 'langchain/chat_models/openai';
import {OpenAIEmbeddings} from 'langchain/embeddings/openai';
import styled from 'styled-components';
import {
  ChatMessageHistory,
  BufferWindowMemory,
} from 'langchain/memory';
import {HumanChatMessage, AIChatMessage} from 'langchain/schema';
import {initializeAgentExecutorWithOptions} from 'langchain/agents';
import {Serper} from 'langchain/tools';
import {Calculator} from 'langchain/tools/calculator';
import {CallbackManager} from 'langchain/callbacks';
import {WebBrowser} from 'langchain/tools/webbrowser';

const Container = styled.div.attrs((props) => ({
  display: props.display || 'flex',
  flexDirection: props.flexDirection || 'column',
}))`
  display: ${(props) => props.display};
  flex-direction: ${(props) => props.flexDirection};
  height: 100vh;
  margin: 0 auto;
  background-color: #ddd;
  padding-bottom: 0.5rem;
  overflow-x: hidden;
`;

const Chat_Navbar = styled.div`
  display: flex;
  flex-direction: row;
  padding: 0.5rem 1rem;
  justify-content: space-between;
  font-size: 1rem;
`;

const Chat_Message_Log = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1rem;
  margin: 0 3px;
  display: flex;
  flex-direction: column;
  background-color: #eee;
`;

const Chat_Message_Form = styled.form`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  justify-content: space-between;
  align-items: start;
  padding: 1rem 1rem 0;

  width: inherit;
  min-height: 4.6875rem;
  height: 100%;
  max-height: 6.25rem;
`;

const Chat_Message_Textarea = styled.textarea`
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  align-items: center;

  padding: 0.5rem;
  resize: none;
  border: 1px solid #000;
  border-radius: 0.5rem;
  width: 450px;
  height: 4.6875rem;
  &:focus {
    flex-grow: 1;
    padding: 0.5rem;
    resize: none;
    border: 1px solid #000;
    border-radius: 0.5rem;
  }
`;

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
  const [tab_link, setTabLink] = useState('');
  const [transcript, setTranscript] = useState('');

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [_memory, setMemory] = useState([]);
  const [tokens_used, setTokensUsed] = useState(0);

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
  // LLM Model
  const model = new ChatOpenAI({
    temperature: 0,
    cache: true,
    openAIApiKey: process.env.OPENAI_API_KEY,
    streaming: false,

    callbackManager: CallbackManager.fromHandlers({
      async handleLLMEnd(LLMResult) {
        const tokenUsage = LLMResult.llmOutput.tokenUsage;
        const data = LLMResult.text;
        setTokensUsed(tokenUsage.totalTokens);
        console.log(
          `Total Tokens Used: ${tokenUsage.totalTokens}, Completion Tokens: ${tokenUsage.completionTokens}, Prompt Tokens: ${tokenUsage.promptTokens}, text: ${LLMResult.text}`
        );
      },
    }),
  });
  // OpenAI Embedding
  const embeddings = new OpenAIEmbeddings();
  // AI Tools
  const tools = [new WebBrowser({model, embeddings}), new Calculator()];

  const handleSubmit = async (e) => {
    const memory = new BufferWindowMemory({
      chatHistory: new ChatMessageHistory(_memory),
      returnMessages: true,
      llm: model,
      memoryKey: 'chat_history',
      k: 100,
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
      {content: formattedResponse, sender: 'human'},
    ]);
    setTranscript('');

    // Call the OpenAI API here and update the messages state with the response.
    try {
      const date = new Date();
      const options = {month: 'short', day: '2-digit', year: 'numeric'};
      const formattedDate = date.toLocaleDateString('en-US', options);
      const systemMessage = `I am Pakira. Mission: Progress Humanity, Gain Further Understanding of the Universe, Follow the Law. Current Date: ${formattedDate}; Current Time: ${new Date().toLocaleString(
        'en-US',
        {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/New_York',
        }
      )}; Current Website: ${tab_link}`;

      const executor = await initializeAgentExecutorWithOptions(tools, model, {
        agentType: 'chat-conversational-react-description',
        agentArgs: {
          systemMessage: systemMessage,
        },
        memory,
        maxIterations: 8,
        verbose: true,
        async handleChainEnd(ChainResult) {
          // const tokenUsage = LLMResult.llmOutput.tokenUsage;
          console.log(`Text: ${ChainResult}`);
        },
      });

      await executor
        .call({
          input: formattedResponse,
        })
        .then(async (response) => {
          const data = await response['output'];
          console.log('data', data, response);
          // setTokensUsed(tokenUsage.totalTokens);

          setMessages((prevMessages) => [
            ...prevMessages,
            {content: data, sender: 'ai'},
          ]);
          // Save assistant message to memory
          setMemory((prevMemory) => {
            console.log(new AIChatMessage(data, 'ai'));
            let msg = new AIChatMessage(data, 'ai');
            msg.name = 'ai';

            return prevMemory.length > 0 ? [...prevMemory, msg] : [msg];
          });
        })
        .catch((error) => {
          console.log('error', error);
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
      if (typeof storedMessages === 'string' && storedMessages.length > 0) {
        console.log(
          'Loading messages from local storage'
          //typeof JSON.parse(storedMessages)
        );
        setMessages(
          typeof JSON.parse(storedMessages) === 'object'
            ? JSON.parse(storedMessages)
            : storedMessages
        );
      }
    }
  };
  useEffect(() => {
    loadMessagesFromLocalStorage();
    if (typeof chrome !== 'undefined') {
      // console.log('chrome is defined', chrome);
      async function getCurrentTabUrl() {
        const tabs = await chrome.tabs.query({active: true});
        return await tabs[0].url;
      }
      getCurrentTabUrl().then((url) => {
        setTabLink(url);
        return url;
      });
      // console.log('?', getCurrentTabUrl());
    }
  }, []);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);
  return (
    <Container>
      <Chat_Navbar>
        <span>GPT-PAKIRA</span>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='16'
          height='16'
          fill='currentColor'
          class='bi bi-three-dots-vertical'
          viewBox='0 0 16 16'>
          <path d='M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z' />
        </svg>
      </Chat_Navbar>
      <Chat_Message_Log ref={chatLogRef}>
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            {message.sender == 'ai' && (
              <div className='icon'>
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
                  <rect width='100' height='100' fill='#ccc' />
                  <text
                    x='50'
                    y='65'
                    font-size='50'
                    fill='#fff'
                    text-anchor='middle'>
                    P
                  </text>
                </svg>
              </div>
            )}

            <div className='chat-msg'>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </Chat_Message_Log>
      <Chat_Message_Form className='input-form' onSubmit={handleSubmit}>
        {!isLoaded ? (
          <Chat_Message_Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Type your message...'
          />
        ) : (
          <span>Processing...</span>
        )}
        <div>{`Tokens Used: ${tokens_used}`}</div>
      </Chat_Message_Form>
      <style global jsx>{`
        .chat-msg {
          margin-left: 0.5rem;
          word-break: break-word;
          width: 100%;
        }

        .message {
          margin-bottom: 0.5rem;
          display: flex;
          flex-direction: row;
          word-break: break-word;
        }

        .message.ai {
          word-break: break-word;
        }

        .message.human {
          align-self: flex-end;
          background-color: #e0e0e0;
          border-radius: 1rem;
          padding: 0.5rem 1rem;
          align-items: top;
          margin-bottom: 0.5rem;
          word-break: break-word;
        }

        .message img {
          border-radius: 50%;
          height: 24px;
          margin-right: 0.5rem;
          width: 24px;
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
      `}</style>
    </Container>
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
