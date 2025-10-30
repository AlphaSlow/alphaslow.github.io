// script-movies.js

const pageManager = (function() {
    let _listeningBlanks = [];
    let _comprehensionAnswers = {};
    let _mistakesToHighlight = [];
    let _vocabularyDragWords = [];
    let _vocabularySentences = [];
    let _displayNavigationButtons = true;

    const revealedLetters = {};

    function _revealHint(blankId, solution) {
        const blankSpan = document.getElementById(blankId);
        if (!blankSpan) return;
        const input = blankSpan.querySelector('input[type="text"]');
        if (!input || input.disabled) return;
        if (!revealedLetters[blankId]) {
            revealedLetters[blankId] = 0;
        }
        if (revealedLetters[blankId] < solution.length) {
            revealedLetters[blankId]++;
            input.value = solution.substring(0, revealedLetters[blankId]);
        }
        blankSpan.classList.remove('correct', 'incorrect');
        const clipContainer = blankSpan.closest('.listening-clip');
        const feedbackBox = clipContainer ? clipContainer.querySelector('.feedback-box') : null;
        if (feedbackBox) {
            feedbackBox.innerHTML = '';
            feedbackBox.style.opacity = '0';
            feedbackBox.style.visibility = 'hidden';
        }
    }

    function _revealSolution(blankId, solution) {
        const blankSpan = document.getElementById(blankId);
        if (!blankSpan) return;
        const input = blankSpan.querySelector('input[type="text"]');
        if (input) {
            input.value = solution;
            input.disabled = true;
            blankSpan.classList.add('correct', 'solution-shown');
            blankSpan.classList.remove('incorrect');
            const clipContainer = blankSpan.closest('.listening-clip');
            const feedbackBox = clipContainer ? clipContainer.querySelector('.feedback-box') : null;
            const explanation = blankSpan.dataset.explanation || '';
            if (feedbackBox) {
                feedbackBox.innerHTML = `<span class="feedback-box-icon">✓</span><span class="feedback-box-text">${explanation}</span>`;
                feedbackBox.style.visibility = 'visible';
                feedbackBox.style.opacity = '1';
            }
        }
    }

    function _adjustInputWidth(inputElement, solution) {
        const tempSpan = document.createElement('span');
        tempSpan.style.visibility = 'hidden';
        tempSpan.style.position = 'absolute';
        tempSpan.style.whiteSpace = 'nowrap';
        tempSpan.style.fontFamily = getComputedStyle(inputElement).fontFamily;
        tempSpan.style.fontSize = getComputedStyle(inputElement).fontSize;
        tempSpan.textContent = solution;
        document.body.appendChild(tempSpan);
        const desiredWidth = tempSpan.offsetWidth;
        inputElement.style.width = `${desiredWidth}px`;
        document.body.removeChild(tempSpan);
    }

    function init(data) {
        _listeningBlanks = data.listeningBlanks || [];
        _comprehensionAnswers = data.comprehensionAnswers || {};
        _mistakesToHighlight = data.mistakesToHighlight || {};
        _vocabularyDragWords = data.vocabularyDragWords || [];
        _vocabularySentences = data.vocabularySentences || [];
        _displayNavigationButtons = data.displayNavigationButtons !== undefined ? data.displayNavigationButtons : true;
        const navButtonsSection = document.getElementById('nav-buttons-section');
        if (navButtonsSection) {
            if (_displayNavigationButtons) {
                navButtonsSection.classList.remove('hidden-by-default');
                navButtonsSection.style.display = 'flex';
            } else {
                navButtonsSection.classList.add('hidden-by-default');
                navButtonsSection.style.display = 'none';
            }
        }
        _createListeningClips();
        _populateDraggableWords();
        _setupEventListeners();
    }

    function _createListeningClips() {
        const listeningSection = document.getElementById('listening');
        if (!listeningSection) return;
        const existingH2 = listeningSection.querySelector('h2');
        const existingInstructionBox = listeningSection.querySelector('.instruction-box');
        if (existingH2) existingH2.remove();
        if (existingInstructionBox) existingInstructionBox.remove();
        listeningSection.innerHTML = `
            <h2>Listening</h2>
            <div class="instruction-box"><i class="fas fa-lightbulb icon"></i>Press the Hint button as many times as you like to see more and more information. Press the Solution button to see the full answer.</div>
        `;
        _listeningBlanks.forEach(blankData => {
            const clipContainer = document.createElement('div');
            clipContainer.classList.add('listening-clip');

            const blankReplacement = `<span class="blank-word" id="${blankData.id}" data-solution="${blankData.solution}" data-explanation="${blankData.explanation}"></span>`;
            updatedTranscript = blankData.transcript.replace(/<span\s+class="blank-word"[^>]*>.*?<\/span>/, blankReplacement);

            clipContainer.innerHTML = `
                <div class="clip-video">
                    <video id="listening-${blankData.id}-video" controls>
                        <source src="${blankData.videoSrc}" type="video/mp4">
                        Your browser can not play this video.
                    </video>
                </div>
                <div class="clip-transcript">
                    <p>${updatedTranscript}</p>
                    <div class="controls-and-feedback">
                        <button class="hint-button" data-blank-id="${blankData.id}" data-solution="${blankData.solution}">Hint</button>
                        <button class="solution-button" data-blank-id="${blankData.id}" data-solution="${blankData.solution}">Solution</button>
                        <div class="feedback-box"></div>
                    </div>
                </div>
            `;
            listeningSection.appendChild(clipContainer);
        });
        setupListeningBlanks();
    }

    function setupListeningBlanks() {
        const listeningClips = document.querySelectorAll('.listening-clip');
        listeningClips.forEach(clipContainer => {
            const blankSpan = clipContainer.querySelector('.blank-word');
            if (blankSpan) {
                const blankId = blankSpan.id;
                const solution = blankSpan.dataset.solution.trim();
                const explanation = blankSpan.dataset.explanation || '';
                if (blankSpan.textContent.includes('_______')) {
                    blankSpan.textContent = '';
                }
                const input = document.createElement('input');
                input.type = 'text';
                input.placeholder = '____________________';
                blankSpan.appendChild(input);
                blankSpan.dataset.explanation = explanation;
                _adjustInputWidth(input, solution);
                input.addEventListener('blur', () => {
                    checkListeningBlank(input, solution, blankSpan);
                });
                input.addEventListener('keypress', (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        checkListeningBlank(input, solution, blankSpan);
                        input.blur();
                    }
                });
                const hintButton = clipContainer.querySelector('.hint-button');
                if (hintButton) {
                    hintButton.addEventListener('click', () => {
                        _revealHint(blankSpan.id, solution);
                    });
                }
                const solutionButton = clipContainer.querySelector('.solution-button');
                if (solutionButton) {
                    solutionButton.addEventListener('click', () => {
                        _revealSolution(blankSpan.id, solution);
                    });
                }
            }
        });
    }

    function checkListeningBlank(inputElement, solution, blankContainer) {
        const userAnswer = inputElement.value.trim();
        const clipContainer = inputElement.closest('.listening-clip');
        const feedbackBox = clipContainer ? clipContainer.querySelector('.feedback-box') : null;
        const explanation = blankContainer.dataset.explanation || '';
        blankContainer.classList.remove('correct', 'incorrect', 'solution-shown');
        if (feedbackBox) {
            feedbackBox.innerHTML = '';
            feedbackBox.style.opacity = '0';
            feedbackBox.style.visibility = 'hidden';
        }
        if (userAnswer.length === 0) {
            return;
        }
        if (userAnswer.toLowerCase() === solution.toLowerCase()) {
            blankContainer.classList.add('correct');
            inputElement.disabled = true;
            if (feedbackBox) {
                feedbackBox.innerHTML = `<span class="feedback-box-icon">✓</span><span class="feedback-box-text">${explanation}</span>`;
                feedbackBox.style.visibility = 'visible';
                feedbackBox.style.opacity = '1';
            }
        } else {
            blankContainer.classList.add('incorrect');
        }
    }

    function _populateDraggableWords() {
        const draggableWordsContainer = document.getElementById('draggable-words');
        if (draggableWordsContainer && _vocabularyDragWords.length > 0) {
            const words = [..._vocabularyDragWords];
            words.sort(() => Math.random() - 0.5);
            draggableWordsContainer.innerHTML = '';
            words.forEach(word => {
                const div = document.createElement('div');
                div.classList.add('draggable-word');
                div.setAttribute('draggable', 'true');
                div.setAttribute('data-word', word);
                div.textContent = word;
                draggableWordsContainer.appendChild(div);
            });
            _addDragListenersToWords();
        }
        const vocabularySentencesList = document.getElementById('vocabulary-sentences');
        if (vocabularySentencesList && _vocabularySentences.length > 0) {
            vocabularySentencesList.innerHTML = '';
            _vocabularySentences.forEach((sentence, index) => {
                const li = document.createElement('li');
                li.innerHTML = sentence.text.replace('____', `<span class="blank-drop-target" data-correct-word="${sentence.correctWord}" data-sentence-index="${index}"></span>`);
                vocabularySentencesList.appendChild(li);
            });
            _addDropListenersToBlanks();
        }
    }

    let draggedWord = null;

    function _addDragListenersToWords() {
        document.querySelectorAll('.draggable-word').forEach(word => {
            word.addEventListener('dragstart', (e) => {
                draggedWord = e.target;
                e.dataTransfer.setData('text/plain', e.target.dataset.word);
                setTimeout(() => { e.target.style.opacity = '0.5'; }, 0);
            });
            word.addEventListener('dragend', (e) => { e.target.style.opacity = '1'; });
        });
    }

    function _addDropListenersToBlanks() {
        document.querySelectorAll('.blank-drop-target').forEach(blank => {
            blank.addEventListener('dragover', (e) => { e.preventDefault(); blank.style.borderColor = '#007bff'; });
            blank.addEventListener('dragleave', (e) => { blank.style.borderColor = '#999'; });
            blank.addEventListener('drop', (e) => {
                e.preventDefault();
                blank.style.borderColor = '#999';
                if (draggedWord) {
                    if (blank.textContent.trim() !== '') {
                        const existingWord = document.createElement('div');
                        existingWord.classList.add('draggable-word');
                        existingWord.setAttribute('draggable', 'true');
                        existingWord.setAttribute('data-word', blank.textContent);
                        existingWord.textContent = blank.textContent;
                        document.getElementById('draggable-words').appendChild(existingWord);
                        _addDragListenersToWords();
                    }
                    blank.textContent = draggedWord.dataset.word;
                    draggedWord.remove();
                    draggedWord = null;
                    blank.classList.remove('correct-answer', 'incorrect-answer');
                    document.getElementById('vocabulary-feedback').textContent = '';
                }
            });
        });
    }

    function _checkVocabularyAnswers() {
        let correctDrops = 0;
        const blankDropTargets = document.querySelectorAll('.blank-drop-target');
        const totalBlanks = blankDropTargets.length;
        blankDropTargets.forEach(blank => {
            const droppedWord = blank.textContent.trim();
            const correctWord = blank.dataset.correctWord;
            blank.classList.remove('correct-answer', 'incorrect-answer');
            if (droppedWord.toLowerCase() === correctWord.toLowerCase()) {
                blank.classList.add('correct-answer');
                correctDrops++;
            } else if (droppedWord !== '') {
                blank.classList.add('incorrect-answer');
            }
        });
        const feedbackDiv = document.getElementById('vocabulary-feedback');
        feedbackDiv.textContent = `You got ${correctDrops} out of ${totalBlanks} correct!`;
    }

    // New function to reset comprehension answers
    function _resetComprehensionAnswers() {
        const comprehensionSection = document.getElementById('comprehension1');
        if (!comprehensionSection) return;
        const radioButtons = comprehensionSection.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radio => {
            radio.checked = false;
        });
        const labels = comprehensionSection.querySelectorAll('label');
        labels.forEach(label => {
            label.classList.remove('correct', 'incorrect');
        });
        const feedbackDiv = document.getElementById('answer-feedback');
        if (feedbackDiv) {
            feedbackDiv.textContent = '';
        }
    }

    function _resetVocabulary() {
        document.querySelectorAll('.blank-drop-target').forEach(blank => {
            blank.textContent = '';
            blank.classList.remove('correct-answer', 'incorrect-answer');
        });
        document.getElementById('vocabulary-feedback').textContent = '';
        _populateDraggableWords();
    }

    function _checkComprehensionAnswers() {
        const answers = _comprehensionAnswers;
        let correctCount = 0;
        const feedbackDiv = document.getElementById('answer-feedback');
        feedbackDiv.innerHTML = '';
        for (const question in answers) {
            const selectedAnswer = document.querySelector(`input[name="${question}"]:checked`);
            const questionElement = document.querySelector(`input[name="${question}"]`).closest('.question');
            questionElement.querySelectorAll('label').forEach(label => {
                label.classList.remove('correct', 'incorrect');
            });
            if (selectedAnswer) {
                if (selectedAnswer.value === answers[question]) {
                    correctCount++;
                    selectedAnswer.parentElement.classList.add('correct');
                } else {
                    selectedAnswer.parentElement.classList.add('incorrect');
                }
            }
        }
        feedbackDiv.textContent = `You got ${correctCount} out of ${Object.keys(answers).length} correct!`;
    }

    function _highlightMistakes() {
        const mistakesSection = document.getElementById('mistakes');
        if (!mistakesSection) return;
        const articleParagraph = document.getElementById("mistakes-text-content");
        if (!articleParagraph) return;
        let currentHTML = articleParagraph.innerHTML;
        const mistakes = _mistakesToHighlight;
        mistakes.forEach(mistake => {
            const regex = new RegExp(`(?<!<span class="highlighted">|class="highlighted">)([\\w\\s.,?!'"]*?)(${mistake.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})([\\w\\s.,?!'"]*?)(?!<\\/span>)`, 'gi');
            currentHTML = currentHTML.replace(regex, `$1<span class="highlighted">$2</span>$3`);
        });
        articleParagraph.innerHTML = currentHTML;
    }

    function _setupEventListeners() {
        const checkAnswersButton1 = document.querySelector('#comprehension1 .check-answers-button');
        if (checkAnswersButton1) {
            checkAnswersButton1.addEventListener('click', _checkComprehensionAnswers);
        }

        // Add event listener for the new reset button
        const resetButton1 = document.querySelector('#comprehension1 .reset-button');
        if (resetButton1) {
            resetButton1.addEventListener('click', _resetComprehensionAnswers);
        }

        const highlightButton = document.querySelector('#mistakes .check-answers-button');
        if (highlightButton) {
            highlightButton.addEventListener('click', _highlightMistakes);
        }
        const checkVocabButton = document.querySelector('#vocabulary .check-answers-button');
        if (checkVocabButton) {
            checkVocabButton.addEventListener('click', _checkVocabularyAnswers);
        }
        const resetVocabButton = document.querySelector('#vocabulary .reset-button');
        if (resetVocabButton) {
            resetVocabButton.addEventListener('click', _resetVocabulary);
        }
    }

    return {
        init: init
    };
})();
