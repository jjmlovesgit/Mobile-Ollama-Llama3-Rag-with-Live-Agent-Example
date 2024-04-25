//langindex.js - Separation of concerns for Langchain response handling
import { handleDIDStreaming } from './streaming-client-api.js';

document.addEventListener('DOMContentLoaded', () => {
  // Getting references to various elements on the page
  const userInputField = document.getElementById('user-input-field');
  const startButton = document.getElementById('talk-button');
  const responseContainer = document.getElementById('response-container');
  const readAloudCheckbox = document.getElementById('toggleReadAloud');
  const toggleDIDCheckbox = document.getElementById('toggleDID');
  
  // Global variable to store the last response
  let lastResponse = '';

  // Getting reference to the Short Answer checkbox
  const toggleShortAnswerCheckbox = document.getElementById('toggleShortAnswer');


  // Event listener for the "Start" button click
  startButton.addEventListener('click', async () => {
    // Retrieve user input from the input field
    const userInput = userInputField.value;

    // Get the state of the Short Answer checkbox
    const isShortAnswer = toggleShortAnswerCheckbox.checked;

    try {
      // Play typing sound
      //playTypingSound();
  
      // Cancel any ongoing speech synthesis
      window.speechSynthesis.cancel();
  
      // Send the user input and prompt type to the server via a POST request
      const response = await fetch('/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userInput, isShortAnswer: isShortAnswer })
      });

      // Check if the server response is OK
      if (!response.ok) {
        throw new Error(`Server responded with status code: ${response.status}`);
      }

      // Parse the server's JSON response
      const responseData = await response.json();
      let chatText = responseData.text ? responseData.text.trim() : '';

      // Replace a generic "I don't know" response with a more informative message
      if (chatText === "I don't know.") {
        chatText = "That information is not in my knowledge base, please ask another question.";
      }
      // Update lastResponse with the new chat response
      lastResponse = responseData.text;
      console.log("New chat response:", lastResponse);

      // Stream the new response and check if it should be read aloud
      responseContainer.innerHTML = '';
      streamText(chatText, responseContainer, 50); // Streaming text with 50ms delay

      if (readAloudCheckbox.checked && chatText) {
        lastResponse = chatText; // Store the response to replay later
        speak(chatText);
      };

      // Check if streaming to D-ID is enabled
      if (toggleDIDCheckbox.checked) {
        handleDIDStreaming(lastResponse);
      }
    } catch (error) {
      console.error('Error sending query to the server:', error);
      responseContainer.textContent = 'Error: Could not get a response.';
    }
  });

  // Event listener for the Replay button on Voice only
  const replayButton = document.getElementById('replay-button');
  replayButton.addEventListener('click', () => {
    if (lastResponse) {
      speak(lastResponse); // Replay the last response
    } else {
      console.log("No response to replay.");
    }
  });

  // Default streaming to D-ID is off
  let shouldStreamToDID = false;

  toggleDIDCheckbox.addEventListener('change', () => {
    shouldStreamToDID = toggleDIDCheckbox.checked;
  });

  // Function to create a stream text effect into our container element, character by character
  function streamText(responseText, container, interval = 50) {
    const words = responseText.split(' '); // Split response into individual words
    let currentIndex = 0;

    // Interval function to add words one by one into the container
    const wordStreamer = setInterval(() => {
      if (currentIndex < words.length) {
        container.innerHTML += words[currentIndex] + ' ';
        currentIndex++;
      } else {
        clearInterval(wordStreamer); // Stop streaming when all words are added
      }
    }, interval);
  }

  // Function to use local speech synthesis voice to read out text (Voice requested must be installed)
  function speak(text) {
    const synth = window.speechSynthesis; // Reference to speech synthesis interface

    // Function to set the voice and speak the text
    function setVoiceAndSpeak() {
      const voices = synth.getVoices();
      let selectedVoice = voices.find(voice => voice.name === "Microsoft Clara Online (Natural) - English (Canada)");

      // Default to an English voice if the desired voice isn't found
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang === 'en-US');
        console.log('Desired voice not found, using default English voice:', selectedVoice ? selectedVoice.name : 'none found');
      }

      const utterance = new SpeechSynthesisUtterance(text);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // Speak the text
      synth.speak(utterance);
    }

    // Handle case where voices haven't loaded yet
    if (synth.getVoices().length === 0) {
      synth.onvoiceschanged = () => {
        setVoiceAndSpeak();
        synth.onvoiceschanged = null; // Remove event listener after setting voice
      };
    } else {
      setVoiceAndSpeak();
    }
  }

  // Function to play typing sound
 // function playTypingSound() {
 //   const audio = new Audio('typing.wav');
//    audio.play();
//  }

  
});
