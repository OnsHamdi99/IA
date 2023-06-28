import { API_KEY } from './config.js';
import { getImageFromDallE } from './dallE.js';

const endpointURL = 'https://api.openai.com/v1/chat/completions';

let outputElement, submitButton, inputElement, historyElement, buttonElement;
let imageSize = 256; // Taille par défaut des images
let styleImage ;
let weatherStyle;
let conversations = [];

window.onload = init;
function checkInput() {
  let prompt = inputElement.value.toLowerCase().trim();

  if (prompt.startsWith('/image')) {
    // Show image-related GUI elements
    showImageGUI();
  } else {
    // Hide image-related GUI elements
    hideImageGUI();
  }
}

function init() {
  outputElement = document.querySelector('#output');
  submitButton = document.querySelector('#submit');
  submitButton.onclick = getMessage;

  inputElement = document.querySelector('input');
  historyElement = document.querySelector('.history');
  buttonElement = document.querySelector('button');
  buttonElement.addEventListener('click', startNewChat);
  buttonElement.onclick = clearInput;
  styleImage = document.getElementById('style-select');
  weatherStyle = document.getElementById('weather-select');
  hideImageGUI();
  inputElement.addEventListener('input', checkInput);
}
function showImageGUI() {
  styleImage.style.display = 'block';
  weatherStyle.style.display = 'block';
}
function loadConversation(conversation) {
  outputElement.innerHTML = ''; // Clear the output element

  // Render each message in the selected conversation
  conversation.messages.forEach(message => {
      renderMessage(message);
  });
}
const numConversations = 0;
function renderConversationList() {
  numConversations
  const conversationListElement = document.getElementById('conversation-list');
  conversationListElement.innerHTML = ''; // Clear the conversation list

  conversations.forEach(conversation => {
      const conversationItem = document.createElement('li');
      conversationItem.textContent = 'Conversation ' + numConversations;
      conversationItem.addEventListener('click', () => {
          loadConversation(conversation); // Load the selected conversation
      });
      conversationListElement.appendChild(conversationItem);
  });
}

function startNewChat() {
  const conversation = {
      id: Date.now(), // Generate a unique ID for the conversation
      messages: [] // Array to store messages of the conversation
  };
  conversations.push(conversation); // Add the new conversation to the list

  renderConversationList(); // Update the conversation list UI
  clearInput(); // Clear the input field
}

function hideImageGUI() {
  styleImage.style.display = 'none';
  weatherStyle.style.display = 'none';
}
function clearInput() {
  inputElement.value = '';
}

function downloadImage(url) {
  const link = document.createElement('a');
  link.href = url;
  link.download = 'image.jpg';
  link.target = '_blank';
  link.click();
  }

async function getMessage() {
  let prompt = inputElement.value.toLowerCase().trim(); // On met le prompt en minuscules et on supprime les espaces au début et à la fin
  const userMessage = {
  role: 'user',
  content: prompt
};
  const currentConversation = conversations[conversations.length - 1];
    currentConversation.messages.push(userMessage); // Add the user's message

  if (prompt.startsWith('/image')) { 
    // Extraction de la taille des images depuis le prompt (si spécifiée)
    const promptParts = prompt.split(' '); // On sépare le prompt en mots
    if (promptParts.length >= 2 && !isNaN(promptParts[1])) { // Si le deuxième mot est un nombre
      imageSize = parseInt(promptParts[1], 10); // On récupère la taille
      prompt = promptParts.slice(2).join(' '); // On supprime la taille et on recolle les mots
    } else { // on supprime juste /image, une taille n'a pas été détectée, on récu^ère taille par défaut définie plus haut
        prompt = prompt.substr(7);
        }
    if (styleImage.value != ""){
          prompt = prompt + " in " + styleImage.value + " style";
  }
  if (weatherStyle != ""){
          prompt = prompt + " during " + weatherStyle.value;
  }
    console.log("Prompt final de l'utilisateur : ", prompt);
    //début gestion génération de propmt à partir du prompt de l'utilisateur
    console.log("Message de GPT-3.5 pour DALL-E");
   // const generatedPrompt = await getPromptFromGPT(prompt); // On génère le prompt pour DALL-E
    //console.log("Prompt généré pour DALL-E :", generatedPrompt);

    console.log("Image de DALL-E");
    let images = await getImageFromDallE(prompt);

    // Effacer les images précédentes
  //  outputElement.innerHTML = '';

    images.data.forEach(imageObj => {
      const imageContainer = document.createElement('div');
      imageContainer.classList.add('image-container');

      const imgElement = document.createElement('img');
      imgElement.src = imageObj.url;
      imgElement.width = imageSize;
      imgElement.height = imageSize;

      imageContainer.append(imgElement);

      // Add the download button
      const downloadButton = document.createElement('button');
      downloadButton.innerHTML = '<i class="fa fa-download"></i> Download Image';
      downloadButton.classList.add('download-button');
      downloadButton.addEventListener('click', () => {
        console.log("image url : " + imageObj.url)
        downloadImage(imageObj.url);
      });

      imageContainer.append(downloadButton);

      outputElement.append(imageContainer);
    });
    
  } else {
    console.log("Message de GPT-3.5");
    getResponseFromGPT(prompt);
  }
  renderMessage(userMessage); // Render the user's message in the UI
  // On vide l'input
  inputElement.value = '';
}
function renderMessage(message) {
  const messageElement = document.createElement('p');
  messageElement.textContent = message.content;

  if (message.role === 'user') {
      messageElement.classList.add('user-message');
  } else {
      messageElement.classList.add('response-message');
  }

  outputElement.appendChild(messageElement);
}
/*
Fonction pour générer le prompt pour DALL-E à partir du prompt de l'utilisateur
*/
async function getPromptFromGPT(prompt) {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: "/dall-e/generate_prompt"
      }, {
        role: "user",
        content: prompt
      }],
      max_tokens: 30
    })
  };
  try {
    const response = await fetch(endpointURL, options); // On envoie la requête
    const data = await response.json(); // On récupère la réponse
    const generatedPrompt = data.choices[0].message.content;    // On récupère le prompt généré
    return generatedPrompt; // On retourne le prompt généré
  } catch (error) {
    console.log(error);
    return null;
  }
}

async function getResponseFromGPT(prompt) {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: prompt
      }],
      max_tokens: 100
    })
  };

  try {
    const response = await fetch(endpointURL, options);
    const data = await response.json();
    console.log(data);
    const chatGptReponseTxt = data.choices[0].message.content;

    // Create a <p> element for the user's question
    const questionElement = document.createElement('p');
    questionElement.textContent = prompt;
    questionElement.classList.add('question');
    outputElement.appendChild(questionElement);

    // Create a <p> element for the response
    const responseElement = document.createElement('p');
    responseElement.textContent = chatGptReponseTxt;
    responseElement.classList.add('answer');
    outputElement.appendChild(responseElement);

    // Add the download button
    const downloadButton = document.createElement('button');
    downloadButton.innerHTML = '<i class="fa fa-download"></i> Download Answer';
    downloadButton.classList.add('download-button');
    downloadButton.addEventListener('click', () => {
      downloadAnswer(chatGptReponseTxt, 'answer.txt');
    });
    outputElement.appendChild(downloadButton);

    // Add the play button
    const playButton = document.createElement('button');
    playButton.innerHTML = '<i class="fa fa-play"></i> Play Answer';
    playButton.classList.add('play-button');
    playButton.addEventListener('click', () => {
      playAnswer(chatGptReponseTxt);
    });
    outputElement.appendChild(playButton);

    // Add to the history on the left side
    if (data.choices[0].message.content) {
      const pElement = document.createElement('p');
      pElement.textContent = inputElement.value;
      pElement.onclick = () => {
        inputElement.value = pElement.textContent;
      };
      historyElement.append(pElement);
    }
  } catch (error) {
    console.log(error);
  }
}

function playAnswer(answerText) {
  const utterance = new SpeechSynthesisUtterance(answerText);
  speechSynthesis.speak(utterance);
}
