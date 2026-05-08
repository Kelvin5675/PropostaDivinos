require('dotenv').config();

async function checkModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();

        if (data.models) {
            const valid = data.models
                .filter(m => m.supportedGenerationMethods.includes('generateContent'))
                .map(m => m.name);
            console.log("Valids:");
            console.log(valid);
        } else {
            console.log("No models found or error:", data);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}
checkModels();
