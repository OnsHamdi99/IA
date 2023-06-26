import { API_KEY } from './config.js';
import { getImageFromDallE } from './dallE.js';

const endpointURL = 'https://api.openai.com/v1/chat/completions';

let outputElement, submitButton, inputElement, historyElement, buttonElement;
let imageSize = 256; // Taille par défaut des images
let styleImage ;
let weitherStyle;

window.onload = init;

function init() {
  outputElement = document.querySelector('#output');
  submitButton = document.querySelector('#submit');
  submitButton.onclick = getMessage;

  inputElement = document.querySelector('input');
  historyElement = document.querySelector('.history');
  buttonElement = document.querySelector('button');
  buttonElement.onclick = clearInput;
}

function clearInput() {
  inputElement.value = '';
}

async function getMessage() {
  let prompt = inputElement.value.toLowerCase().trim(); // On met le prompt en minuscules et on supprime les espaces au début et à la fin

  if (prompt.startsWith('/image ')) { 
    // Extraction de la taille des images depuis le prompt (si spécifiée)
    const promptParts = prompt.split(' '); // On sépare le prompt en mots
    if (promptParts.length >= 2 && !isNaN(promptParts[1])) { // Si le deuxième mot est un nombre
      imageSize = parseInt(promptParts[1], 10); // On récupère la taille
      prompt = promptParts.slice(2).join(' '); // On supprime la taille et on recolle les mots
    } else { // on supprime juste /image, une taille n'a pas été détectée, on récu^ère taille par défaut définie plus haut
        prompt = prompt.substr(7);
        }
    
    console.log("Prompt final de l'utilisateur : ", prompt);
    //début gestion génération de propmt à partir du prompt de l'utilisateur
    console.log("Message de GPT-3.5 pour DALL-E");
    const generatedPrompt = await getPromptFromGPT(prompt); // On génère le prompt pour DALL-E
    console.log("Prompt généré pour DALL-E :", generatedPrompt);

    console.log("Image de DALL-E");
    let images = await getImageFromDallE(generatedPrompt);

    // Effacer les images précédentes
    outputElement.innerHTML = '';

    images.data.forEach(imageObj => {
      const imageContainer = document.createElement('div');
      imageContainer.classList.add('image-container');

      const imgElement = document.createElement('img');
      imgElement.src = imageObj.url;
      imgElement.width = imageSize;
      imgElement.height = imageSize;

      imageContainer.append(imgElement);

      outputElement.append(imageContainer);
    });
  } else {
    console.log("Message de GPT-3.5");
    getResponseFromGPT(prompt);
  }

  // On vide l'input
  inputElement.value = '';
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
    // On crée un élément p pour la réponse
    const pElementChat = document.createElement('p');
    pElementChat.textContent = chatGptReponseTxt;
    // On ajoute la réponse dans le div output
    outputElement.append(pElementChat);

    // Ajout dans l'historique sur la gauche
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
