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
    console.log('Starting speech recognition...')
    const recognition = new window.webkitSpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = transcribeAudio(event.results[0][0].transcript);
      console.log('Speech recognition result:', transcript)
      
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
            <img
              src={
                message.sender === 'user'
                  ? 'https://via.placeholder.com/24' // Replace with the user icon URL
                  : 'https://via.placeholder.com/24' // Replace with the bot icon URL
              }
              alt={`${message.sender} icon`}
            />
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
      return '```\n' + match + '\n```';
    });

    const wrappedMath = wrappedCode.replace(mathPattern, (match) => {
      return '```\n' + match + '\n```';
    });

    return wrappedMath;
  }
  return wrapCodeBlocks(text);
}
