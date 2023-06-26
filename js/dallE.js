import { API_KEY } from './config.js';

export async function getImageFromDallE(prompt) {
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            prompt: prompt,
            n:4,
            size: "256x256"
        })
    }

    try {
        const response = await fetch('https://api.openai.com/v1/images/generations', options);
        const data = await response.json();
        return data;
    } catch (error) {
        console.log(error);
    }
}

