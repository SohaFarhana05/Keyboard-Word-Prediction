// Theme toggle functionality
const currentTheme = localStorage.getItem('theme') || 'dark';
document.body.classList[currentTheme === 'dark' ? 'add' : 'remove']('dark-theme');
document.querySelector('#theme-switch').checked = currentTheme === 'dark';

document.querySelector('.theme-switch input[type="checkbox"]').addEventListener('change', function(e) {
    if (e.target.checked) {
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
    }
});

// Word prediction functionality inspired by the Python code
class WordPredictor {
    constructor() {
        // Sample vocabulary with frequencies (simulating the word_freq_dict from Python)
        this.wordFreqDict = {
            // Common words with their frequencies
            "hello": 150, "help": 120, "here": 100, "her": 80, "he": 200,
            "movie": 90, "move": 85, "moved": 70, "movies": 95, "moving": 75,
            "program": 110, "programming": 85, "programmer": 60, "programs": 70,
            "machine": 80, "learning": 90, "data": 120, "science": 100,
            "computer": 95, "technology": 85, "artificial": 70, "intelligence": 75,
            "python": 100, "javascript": 80, "web": 90, "development": 85,
            "software": 95, "engineering": 80, "project": 110, "code": 105,
            "function": 90, "variable": 75, "algorithm": 85, "structure": 80,
            "database": 70, "network": 75, "security": 80, "system": 100,
            "analysis": 85, "statistics": 70, "model": 90, "prediction": 85,
            "classification": 65, "regression": 60, "neural": 70, "network": 75,
            "deep": 80, "framework": 75, "library": 85, "package": 70,
            "install": 90, "import": 95, "export": 80, "function": 100,
            "class": 105, "object": 90, "method": 95, "property": 80,
            "array": 85, "string": 90, "number": 95, "boolean": 70,
            "null": 60, "undefined": 65, "const": 85, "let": 90, "var": 80
        };
        
        this.totalWords = Object.values(this.wordFreqDict).reduce((sum, freq) => sum + freq, 0);
        this.probs = this.calculateProbabilities();
    }

    calculateProbabilities() {
        const probs = {};
        for (const [word, freq] of Object.entries(this.wordFreqDict)) {
            probs[word] = freq / this.totalWords;
        }
        return probs;
    }

    // Jaccard similarity implementation (2-grams)
    jaccardSimilarity(word1, word2) {
        const ngrams1 = this.getNgrams(word1, 2);
        const ngrams2 = this.getNgrams(word2, 2);
        
        const set1 = new Set(ngrams1);
        const set2 = new Set(ngrams2);
        
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return intersection.size / union.size;
    }

    getNgrams(word, n) {
        const ngrams = [];
        const paddedWord = '#'.repeat(n-1) + word + '#'.repeat(n-1);
        for (let i = 0; i <= paddedWord.length - n; i++) {
            ngrams.push(paddedWord.slice(i, i + n));
        }
        return ngrams;
    }

    // Main autocorrect function (based on the Python implementation)
    autocorrect(inputWord) {
        const word = inputWord.toLowerCase();
        
        // If word exists in dictionary, return it
        if (word in this.probs) {
            return [{
                word: word,
                similarity: 1.0,
                probability: this.probs[word],
                status: 'Found in dictionary'
            }];
        }

        // Calculate similarities for all words
        const suggestions = [];
        for (const dictWord of Object.keys(this.wordFreqDict)) {
            const similarity = this.jaccardSimilarity(word, dictWord);
            if (similarity > 0.1) { // Only consider words with some similarity
                suggestions.push({
                    word: dictWord,
                    similarity: similarity,
                    probability: this.probs[dictWord],
                    score: similarity * this.probs[dictWord] * 1000 // Combined score
                });
            }
        }

        // Sort by similarity first, then by probability
        suggestions.sort((a, b) => {
            if (Math.abs(a.similarity - b.similarity) > 0.01) {
                return b.similarity - a.similarity;
            }
            return b.probability - a.probability;
        });

        return suggestions.slice(0, 3); // Return top 3 suggestions
    }
}

// Initialize word predictor
const predictor = new WordPredictor();

// DOM elements
const wordInput = document.getElementById('word-input');
const predictBtn = document.getElementById('predict-btn');
const resultsContainer = document.getElementById('results');
const loadingElement = document.getElementById('loading');
const exampleWords = document.querySelectorAll('.example-word');

// Event listeners
predictBtn.addEventListener('click', handlePrediction);
wordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        handlePrediction();
    }
});

// Example word buttons
exampleWords.forEach(button => {
    button.addEventListener('click', function() {
        const word = this.getAttribute('data-word');
        wordInput.value = word;
        handlePrediction();
    });
});

// Smooth scrolling for navigation links
document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Handle prediction
function handlePrediction() {
    const inputWord = wordInput.value.trim();
    
    if (!inputWord) {
        showError('Please enter a word to get predictions.');
        return;
    }

    showLoading();
    
    // Simulate processing delay for better UX
    setTimeout(() => {
        const suggestions = predictor.autocorrect(inputWord);
        displayResults(inputWord, suggestions);
        hideLoading();
    }, 800);
}

function showLoading() {
    loadingElement.classList.remove('hidden');
    resultsContainer.innerHTML = '';
}

function hideLoading() {
    loadingElement.classList.add('hidden');
}

function showError(message) {
    hideLoading();
    resultsContainer.innerHTML = `
        <div class="error-message">
            <h3>Error</h3>
            <p>${message}</p>
        </div>
    `;
}

function displayResults(inputWord, suggestions) {
    if (suggestions.length === 0) {
        resultsContainer.innerHTML = `
            <h3>Word Predictions</h3>
            <div class="no-results">
                <p>No similar words found for "<strong>${inputWord}</strong>".</p>
                <p>Try a different word or check the spelling.</p>
            </div>
        `;
        return;
    }

    const isExactMatch = suggestions[0].similarity === 1.0;
    
    let resultsHTML = `
        <h3>Word Predictions for "${inputWord}"</h3>
        ${isExactMatch ? 
            '<div class="exact-match"><p>✅ Word found in dictionary!</p></div>' : 
            '<div class="suggestions-info"><p>Here are the most similar words:</p></div>'
        }
        <div class="suggestions-list">
    `;

    suggestions.forEach((suggestion, index) => {
        const rank = index + 1;
        const similarityPercent = (suggestion.similarity * 100).toFixed(1);
        const probabilityPercent = (suggestion.probability * 100).toFixed(3);
        
        resultsHTML += `
            <div class="suggestion ${index === 0 ? 'top-suggestion' : ''}">
                <div class="suggestion-header">
                    <span class="suggestion-rank">#${rank}</span>
                    <span class="suggestion-word">${suggestion.word}</span>
                    ${index === 0 ? '<span class="best-match">Best Match</span>' : ''}
                </div>
                <div class="suggestion-details">
                    <div class="suggestion-score">
                        <span>Similarity: <strong>${similarityPercent}%</strong></span>
                        <span>Frequency: <strong>${probabilityPercent}%</strong></span>
                    </div>
                    ${suggestion.score ? 
                        `<div class="combined-score">Combined Score: ${suggestion.score.toFixed(2)}</div>` : 
                        ''
                    }
                </div>
            </div>
        `;
    });

    resultsHTML += '</div>';
    
    if (!isExactMatch) {
        resultsHTML += `
            <div class="algorithm-info">
                <h4>How it works:</h4>
                <p>This system uses <strong>Jaccard similarity</strong> with 2-grams to find similar words, 
                then ranks them by combining similarity scores with word frequency probabilities.</p>
            </div>
        `;
    }

    resultsContainer.innerHTML = resultsHTML;
}

// Add some CSS for the new result styles
const additionalStyles = `
    .exact-match {
        background: linear-gradient(45deg, rgba(46, 204, 113, 0.1), rgba(39, 174, 96, 0.1));
        border: 1px solid rgba(46, 204, 113, 0.3);
        border-radius: 10px;
        padding: 1rem;
        margin-bottom: 1.5rem;
        text-align: center;
    }

    .exact-match p {
        color: #27ae60;
        font-weight: 600;
        margin: 0;
    }

    .suggestions-info {
        margin-bottom: 1.5rem;
        text-align: center;
        color: #666;
        font-style: italic;
    }

    .dark-theme .suggestions-info {
        color: #a0a0a0;
    }

    .suggestions-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .suggestion {
        background: rgba(33, 147, 176, 0.05);
        border: 1px solid rgba(33, 147, 176, 0.2);
        border-radius: 12px;
        padding: 1.5rem;
        transition: all 0.3s ease;
        position: relative;
    }

    .suggestion:hover {
        background: rgba(33, 147, 176, 0.1);
        transform: translateX(5px);
    }

    .dark-theme .suggestion {
        background: rgba(109, 213, 237, 0.05);
        border-color: rgba(109, 213, 237, 0.2);
    }

    .dark-theme .suggestion:hover {
        background: rgba(109, 213, 237, 0.1);
    }

    .top-suggestion {
        border-color: #2193b0;
        background: rgba(33, 147, 176, 0.1);
    }

    .dark-theme .top-suggestion {
        border-color: #6dd5ed;
        background: rgba(109, 213, 237, 0.1);
    }

    .suggestion-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .suggestion-rank {
        background: linear-gradient(45deg, #2193b0, #6dd5ed);
        color: white;
        padding: 0.3rem 0.8rem;
        border-radius: 15px;
        font-weight: 600;
        font-size: 0.9rem;
    }

    .suggestion-word {
        font-size: 1.3rem;
        font-weight: 700;
        color: #2193b0;
    }

    .dark-theme .suggestion-word {
        color: #6dd5ed;
    }

    .best-match {
        background: linear-gradient(45deg, #27ae60, #2ecc71);
        color: white;
        padding: 0.3rem 0.8rem;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 600;
        margin-left: auto;
    }

    .suggestion-details {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .suggestion-score {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.95rem;
        color: #666;
    }

    .dark-theme .suggestion-score {
        color: #a0a0a0;
    }

    .combined-score {
        font-size: 0.9rem;
        color: #888;
        font-style: italic;
    }

    .dark-theme .combined-score {
        color: #999;
    }

    .algorithm-info {
        margin-top: 2rem;
        padding: 1.5rem;
        background: rgba(52, 152, 219, 0.05);
        border-left: 4px solid #3498db;
        border-radius: 8px;
    }

    .dark-theme .algorithm-info {
        background: rgba(116, 185, 255, 0.05);
        border-left-color: #74b9ff;
    }

    .algorithm-info h4 {
        color: #3498db;
        margin-bottom: 0.5rem;
    }

    .dark-theme .algorithm-info h4 {
        color: #74b9ff;
    }

    .algorithm-info p {
        color: #666;
        line-height: 1.6;
        margin: 0;
    }

    .dark-theme .algorithm-info p {
        color: #b0b0b0;
    }

    .no-results {
        text-align: center;
        padding: 2rem;
        color: #666;
    }

    .dark-theme .no-results {
        color: #a0a0a0;
    }

    .error-message {
        background: rgba(231, 76, 60, 0.1);
        border: 1px solid rgba(231, 76, 60, 0.3);
        border-radius: 10px;
        padding: 1.5rem;
        text-align: center;
    }

    .error-message h3 {
        color: #e74c3c;
        margin-bottom: 0.5rem;
    }

    .error-message p {
        color: #c0392b;
        margin: 0;
    }

    @media (max-width: 768px) {
        .suggestion-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }

        .best-match {
            margin-left: 0;
        }

        .suggestion-score {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }
    }
`;

// Inject additional styles
const styleElement = document.createElement('style');
styleElement.textContent = additionalStyles;
document.head.appendChild(styleElement);

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Set focus to input field
    wordInput.focus();
    
    // Add some example interactions on page load
    console.log('Word Prediction System Initialized');
    console.log('Available words:', Object.keys(predictor.wordFreqDict).length);
    console.log('Try words like: hel, mov, progam, machne');
});
