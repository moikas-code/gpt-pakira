import {useState, useRef, useEffect} from 'react';
import ReactMarkdown from 'react-markdown';

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

    if (
      inputLowerCase === 'show me your source code' ||
      inputLowerCase === 'improve my source code'
    ) {
      try {
        // Fetch the source code of all files
        const response = await fetch('/api/source_code');
        const data = await response.json();
        const sourceCode = data.sourceCode;

        // Format the source code as a string
        const sourceCodeString = Object.entries(sourceCode)
          .map(([file, content]) => `File: ${file}\n\`\`\`\n${content}\n\`\`\``)
          .join('\n\n');

        // Send the source code to the chatbot
        const codeReviewResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            input: `Please review and suggest improvements for the following source code:\n\n${sourceCodeString}`,
          }),
        });

        // ... (existing code for handling chatbot response)
      } catch (error) {
        console.error(
          'An error occurred while fetching the source code:',
          error
        );
      }
    } else {
      // Call the OpenAI API here and update the messages state with the response.
      try {
        console.log(memory);
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({input: formattedResponse, memory}),
        });

        if (response.ok) {
          const data = await response.json();
          setMessages((prevMessages) => [
            ...prevMessages,
            {content: data.message, sender: 'assistant'},
          ]);
          // Save assistant message to memory
          setMemory((prevMemory) => {
            const updatedMemory = [
              ...prevMemory,
              {content: data.message, role: 'assistant'},
            ];
            while (updatedMemory.length > 10) {
              updatedMemory.shift();
            }
            return updatedMemory;
          });
        } else {
          console.error(
            'An error occurred while fetching the response from the API.'
          );
        }
        setIsLoaded(false);
      } catch (error) {
        console.error(
          'An error occurred while fetching the response from the API:',
          error
        );
        setIsLoaded(false);
      }
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
                <svg
                  viewBox='0 0 100 100'
                  xmlns='http://www.w3.org/2000/svg'>
                  <circle cx='50' cy='50' r='40' fill='#8BC34A' />

                  <circle cx='38' cy='37' r='10' fill='#FFFFFF' />

                  <circle cx='62' cy='37' r='10' fill='#FFFFFF' />

                  <circle cx='38' cy='38' r='5' fill='#000000' />

                  <circle cx='62' cy='38' r='5' fill='#000000' />

                  <path
                    d='M 40 60 Q 50 70 60 60'
                    stroke='#000000'
                    fill='none'
                    stroke-width='5'
                  />

                  <circle cx='50' cy='75' r='7' fill='#F57C00' />

                  <line
                    x1='50'
                    y1='70'
                    x2='50'
                    y2='80'
                    stroke='#000000'
                    stroke-width='3'
                  />

                  <path
                    d='M 50 85 Q 40 90 50 95 Q 60 90 50 85'
                    fill='#8D6E63'
                    stroke='#000000'
                    stroke-width='3'
                  />

                  <path
                    d='M 70 40 Q 80 30 75 20 Q 70 30 70 40'
                    fill='#8D6E63'
                    stroke='#000000'
                    stroke-width='3'
                  />

                  <path
                    d='M 30 40 Q 20 30 25 20 Q 30 30 30 40'
                    fill='#8D6E63'
                    stroke='#000000'
                    stroke-width='3'
                  />

                  <path
                    d='M 35 55 Q 50 70 65 55 Q 50 65 35 55'
                    fill='#F57C00'
                    stroke='#000000'
                    stroke-width='3'
                  />

                  <rect
                    x='40'
                    y='45'
                    width='20'
                    height='10'
                    rx='2'
                    fill='#8D6E63'
                    stroke='#000000'
                    stroke-width='3'
                  />

                  <rect
                    x='20'
                    y='50'
                    width='10'
                    height='20'
                    rx='2'
                    fill='#8D6E63'
                    stroke='#000000'
                    stroke-width='3'
                  />

                  <rect
                    x='70'
                    y='50'
                    width='10'
                    height='20'
                    rx='2'
                    fill='#8D6E63'
                    stroke='#000000'
                    stroke-width='3'
                  />

                  <path
                    d='M 40 30 Q 45 20 50 30 Q 55 20 60 30'
                    stroke='#000000'
                    fill='none'
                    stroke-width='5'
                  />

                  <circle cx='50' cy='20' r='5' fill='#F44336' />

                  <circle cx='47' cy='18' r='1' fill='#000000' />

                  <circle cx='53' cy='18' r='1' fill='#000000' />

                  <rect
                    x='46'
                    y='12'
                    width='8'
                    height='3'
                    rx='1'
                    fill='#F44336'
                    stroke='#000000'
                    stroke-width='1'
                  />
                </svg>
              )}
            </div>

            <div>
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
        }

        .chat-log {
          flex-grow: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
        }

        .message {
          margin-bottom: 0.5rem;
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
