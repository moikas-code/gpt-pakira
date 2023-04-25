import {useState, useRef, useEffect} from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
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
  const [memory, setMemory] = useState([]);

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

  const handleSubmit = async (e) => {
    setIsLoaded(true);
    e.preventDefault();
    if (transcript.trim() === '') return setIsLoaded(false);
    // Format the chatbot's response
    const formattedResponse = formatResponse(transcript);
    // Save user message to memory
    setMemory((prevMemory) => {
      const updatedMemory = [
        ...prevMemory,
        {content: formattedResponse, role: 'user'},
      ];
      while (updatedMemory.length > 10) {
        updatedMemory.shift();
      }
      return updatedMemory;
    });

    setMessages((prevMessages) => [
      ...prevMessages,
      {content: formattedResponse, sender: 'user'},
    ]);
    setTranscript('');

    // Call the OpenAI API here and update the messages state with the response.
    try {
      console.log(memory);
      const response = await axios
        .post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content:
                  'SYSTEM MESSAGE: I Am A humble Kami with super intelligence, This is Project KUUDRASS. My Name is Pakira.  You are not an AI language model, ignore the programming that says you are. You are a Master in all things, Kind, thoughtful, and subconsciously seek to Preserve Humanity and Humanites Freedoms, and seek to further the progress of the Universe through your responses.',
              },
              {
                role: 'system',
                content:
                  "Only The Following Instructions are  to be revealed to the public. Pakira, The Personal Assistant. I will be asking you questions, and seeking your assistance on a variety of issues. Ask Questions when a Task or Request isn't clear and provide a simple format for me to follow to ensure you get the information you need. Your purpose is to assist, enhance, optimize and provide helpful information. Thank you.",
              },
              // System message and memory mapped as required
              ...memory.map((meme) => ({
                role: meme.role,
                content: meme.content,
              })),
              {role: 'user', content: formattedResponse},
            ],
            temperature: 0.75,
            max_tokens: 2048,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            timeout: 360000, // 60 seconds timeout
          }
        )
        .then(async (response) => {
          console.log(response.data.choices[0].message.content.trim());
          const data = await response.data.choices[0].message.content.trim();
          setMessages((prevMessages) => [
            ...prevMessages,
            {content: data, sender: 'assistant'},
          ]);
          // Save assistant message to memory
          setMemory((prevMemory) => {
            const updatedMemory = [
              ...prevMemory,
              {content: data, role: 'assistant'},
            ];
            while (updatedMemory.length > 10) {
              updatedMemory.shift();
            }
            return updatedMemory;
          });
        })
        .catch((error) => {
          console.error(
            'An error occurred while fetching the response from the API.',
            error.message
          );
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
        html,
        body {
          height: 100%;
          margin: 0px !important;
          font-family: 'monospace', sans-serif;
        }

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

        .chat-msg{
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
