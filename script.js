
//possible punctuation
const punctuation = ['.', ',', '?', '!', ';', ':', '-'];
const MAX_GUESSES = 6;

const allSentences = {easy: [], medium: [], hard: []};
const allBooks = new Map();

const sentence = document.getElementById("sentence");
let originalText = "the man";
let punctuationCount = 0;

let mode = "easy";
let level = "easy";

let draggedDropBox = null;

let dropBoxWidth = '3vw';
let dropBoxHeight = '4vw';

let gameOver = false;

//currently viewing a different guess
let currentlyViewing = -1;

//what is currently in the sentence
let currentSentencePunctuation = [];
let currentColors = [];

let nextGuessPressed = false;
let currentGuess = 0;
let submitted = false;

//array that in the end will have a length of five and store each user guess
let guesses = [];
let punctuationInBoxes = [];
let dropBoxPunctuation = [];
let fullPunctuationIndexes = [];
let punctuationIndexes = [];

let colors = [];
let fullColors = [];

//grid and keyboard elements
const grid = document.getElementById('grid');
const keyboard = document.getElementById('keyboard');

let cleanedSentence;

let correctPunctuation = [];
let userPunctuation = [];

//need to change this to be based on the amount removed
let wordLength;

let lastBoxes = [];

let viewSentenceButtons = document.querySelectorAll('.viewSentence');

document.getElementById('enter-button').addEventListener('click', comparePunctuation);
document.getElementById('nextGame').addEventListener('click', newGame);

//configure seeded random number generator for daily challange
function RNG(seed) {
    var m = 2**35 - 31
    var a = 185852
    var s = seed % m
    return function () {
        return (s = s * a % m) / m
    }
}

let selectedDate = null;
function getDailyChallengeDt(){     
    return selectedDate != null ? new Date(selectedDate + " EDT") : new Date();
}

function getDailyChallengeDate(){
    return formatDate(getDailyChallengeDt());
}

function getDailyChallengeDateDisplay(){
    return getDailyChallengeDt().toLocaleDateString();
}

function formatDate(d){
    let year = d.toLocaleDateString("en-US", {timeZone: "America/New_York", year:"numeric"})
    let month = d.toLocaleDateString("en-US", {timeZone: "America/New_York", month:"2-digit"})
    let day = d.toLocaleDateString("en-US", {timeZone: "America/New_York", day:"2-digit"})
    return year + "-" + month + "-" + day;    
}

let seededRandom;
function getSeededRandom(max){
    return Math.floor(Math.abs(seededRandom()) * max);
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

newGame();

function openStats() {
    setupStats();
    document.getElementById("overlay1").style.display = "block";
}

function closeStats() {
    document.getElementById("overlay1").style.display = "none";
}

function openQuestionMark() {
    document.getElementById("overlay3").style.display = "block";
}

function closeQuestionMark() {
    document.getElementById("overlay3").style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    let modal = document.getElementById("stats");
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

function setupCalendar(){
    win_dates = [];
    all_dates = [];
    for (let key of Object.keys(localStorage)){
        let key_parts = key.split(':');
        if (key_parts[0] != "d")
            continue;
        let d = key_parts[1];
        let value = getFromLocalStorage(key);
        all_dates.push(d);
        if (value == 1)
            win_dates.push(d);
    }

    const options = {
        selectedWeekends: [],
        dateMax: formatDate(new Date()),
        selectedHolidays: all_dates,
        selectedDates: [getDailyChallengeDate()],
        onClickDate(self) {
            if (self.context.selectedDates.length > 0){
                d = self.context.selectedDates[0];
                if (d != getDailyChallengeDate()){
                    selectedDate = d;
                    newGame();
                }
            }
        },
        onCreateDateEls(self, dateEl) { 
            let completed = dateEl.hasAttribute('data-vc-date-holiday');
            let selected = dateEl.hasAttribute('data-vc-date-selected');
            if (completed){
                if (selected)
                    dateEl.style = "background-color: #0000FF;";

                const btnEl = dateEl.querySelector('[data-vc-date-btn]');
                                
                btnEl.style = "background-color: #00FF00; color: #000000";
                let d = formatDate(new Date(btnEl.getAttribute("aria-label")));
                if (win_dates.includes(d))
                    btnEl.style = "background-color: #00FF00; color: #000000";
                else
                    btnEl.style = "background-color: #FF0000; color: #000000";
            }
          },
    }

    const { Calendar } = window.VanillaCalendarPro;
    const calendar = new Calendar('#calendar', options);
    calendar.init();    
}

function setupChart(){
    const yArray = ["6", "5", "4", "3", "2", "1"];
    const xArray = [];

    for (let y of yArray){
        xArray.push(getFromLocalStorage(mode + ":win:" + y));
    }

    const data = [{
        x:xArray,
        y:yArray.map(v => v + "-"),
        text: xArray,
        textposition: 'outside',
        texttemplate: ' %{text}',
        type:"bar",
        orientation:"h",
        marker: {
            color:"rgb(62, 159, 102)",
            line: {
                color: 'rgb(62, 159, 102)',
                width: 10
            }
        }
    }];

    const layout = {
        margin: {l: 20, r: 0, b: 0, t: 20},
        font: {
            size: 16,
            family: 'sans-serif'
        }
    };

    const maxValue = Math.max(...xArray);
    if (maxValue == 0)
        layout.xaxis = {range: [0, 1]}
    else
        layout.xaxis = {range: [0, maxValue*1.1]}

    Plotly.newPlot("myPlot", data, layout, {staticPlot: true});
}

function setupTotals(){
    let num_wins = getFromLocalStorage(mode + ":win");
    let num_losses = getFromLocalStorage(mode + ":loss");
    let played = num_wins + num_losses;
    let win_pct = played > 0 ? Math.round(100*num_wins/played) : "0";

    document.getElementById("played").innerHTML = `${played}<br/>Played`;
    document.getElementById("winpct").innerHTML = `${win_pct}<br/>Win%`;
    
    document.getElementById("modeStats").innerHTML = mode == "daily" ? "Daily Challenge <br>Level: " +  level[0].toUpperCase() + level.slice(1): "Level: " + level[0].toUpperCase() + level.slice(1);
}

function setupStats(){
    setupTotals();
    setupChart();
    if (mode == "daily")
        setupCalendar();
}

/* Set the width of the sidebar to 20vh (show it) */
function openNav() {
    document.getElementById("mySidepanel").style.width = "20vw";
}
  
/* Set the width of the sidebar to 0 (hide it) */
function closeNav() {
    document.getElementById("mySidepanel").style.width = "0";
}

function hasUrlParam(param){
    const queryString = window.location.search;    
    const urlParams = new URLSearchParams(queryString);   
    return urlParams.has(param);
}

function getUrlParam(param){
    const queryString = window.location.search;    
    const urlParams = new URLSearchParams(queryString);   
    return urlParams.get(param);
}

function resetVariables(){
    gameOver = false;

    currentlyViewing = -1;
    punctuationCount = 0;
    currentGuess = 0;

    currentSentencePunctuation = [];
    currentColors = [];

    nextGuessPressed = false;
    submitted = false;

    guesses = [];
    punctuationInBoxes = [];
    dropBoxPunctuation = [];
    fullPunctuationIndexes = [];
    punctuationIndexes = [];

    colors = [];
    fullColors = [];

    correctPunctuation = [];
    userPunctuation = [];

    lastBoxes = [];

    resetSeeInSentence();
}

function resetSeeInSentence(){
    for (let i = 1; i < 7; i++){
        const button = document.getElementById("see" + i);
        button.textContent = "See in sentence";
        button.setAttribute("state", "disabled");
    }
}

async function newGame() {  
    await downloadSentences();

    document.getElementById('nextGuess').disabled = false;
    resetVariables(); 
    mode = getUrlParam('mode');        
    let calendarDisplay = "none";
    let modeText = "";

    if (mode == "daily"){
        let date = getDailyChallengeDate();
        seededRandom = RNG(new Date(date).getTime());
        let levelIndex = getSeededRandom(3);
        //console.log("Daily challange level index: ", levelIndex);
        level = ["easy", "medium", "hard"][levelIndex];
        calendarDisplay = "block";
        document.getElementById('nextGame').style.display = "none";        
        console.log(`Starting daily challange for ${date} game with level ${level}`);
        modeText = "Daily Challenge for " + getDailyChallengeDateDisplay();
        modeText += "<br/>Level: " + level[0].toUpperCase() + level.slice(1);

    } else {
        level = mode;
        calendarDisplay = "none";
        document.getElementById('nextGame').style.display = "block";
        console.log("Starting new game with level: " + level);
        modeText += "Level: " + level[0].toUpperCase() + level.slice(1);
    }
    
    //document.getElementById("mode").src = "images/punctleLogo.png"
    //document.getElementById("mode").innerHTML = "PUNCTLE"
    //document.getElementById("mode").innerHTML = modeText;
    document.getElementById("calendar").style.display = calendarDisplay;
    
    //generate random sentence and whole screen
    let success = false;
    while (!success)
        success = getRandomSentence();
}

async function downloadSentences() {
    if (allBooks.size > 0)
        return;

    try {
        const response = await fetch('sentences.txt')
        if (!response.ok) {
            console.error('Failed to load the sentence file', response.status);
            alert("Failed to load file with sentences");
            throw new Error(`Response status: ${response.status}`);
        }

        const text = await response.text();

        const sentences = text.split('\n').map(sentence => sentence.trim()).filter(sentence => sentence !== '');
        for (const sentence of sentences) {
            const fields = sentence.split('|');
            if (fields.length == 4){
                //book info
                const book = {
                    id: fields[0],
                    author: fields[1],
                    title: fields[2],
                    image: fields[3]
                };
                allBooks.set(book.id, book);
            } else {
                //sentences
                const sentence = {
                    book_id: fields[0],
                    level: fields[1],
                    sentence: fields[2]
                }
                allSentences[sentence.level].push(sentence);
            }
        }

        console.log(`Downloaded ${allBooks.size} books`);
        console.log("Sentence counts (easy/medium/hard)", allSentences.easy.length, allSentences.medium.length, allSentences.hard.length);
    } catch (error) {
        console.error('Failed to load the sentence file', error);
        alert("Failed to load file with sentences");
        throw new Error(`Failed to load sentence file: ${error}`);
    }
}

function getRandomSentence() {   
    let randomSentence = "";

    while (true){
        const sentences = allSentences[level];
        const randomIndex = mode == "daily" ? getSeededRandom(sentences.length) : getRandomInt(sentences.length);
        const sentenceData = sentences[randomIndex];
        const bookData = allBooks.get(sentenceData.book_id);

        document.getElementById("author").innerText = "By: " + bookData.author;
        document.getElementById("title").innerText = "\"" + bookData.title + "\"";
        document.getElementById("info_img").setAttribute("src", bookData.image);

        randomSentence = sentenceData.sentence;
        let count = getPunctuationCount(randomSentence);
        if (isValidPunctuationCountForLevel(count))
            break;
    }

    //pass the random sentence to the next method
    console.log(randomSentence);
    originalText = randomSentence;
    
    //originalText = "the man-walked to school"
    if (!removePunctuation(originalText)){
        //console.log("Incorrect punctuationCount for level");
        return false;
    }

    makeGuessBoxes();
    createGrid();
    generateKeyboard(); 
    getCorrectAnswer();
    alignButtons();

    return true;
}

function getPunctuationCount(sentence){
    let count = 0;
    for (let c of sentence){
        if (punctuation.includes(c))
            ++count;
    }
    return count;
}


//changing the font size to fit the long sentences
function adjustFontSize() {
    const containerWidth = sentence.offsetWidth;
    const wordCount = cleanedSentence.split(/\s+/).length;
    const baseFontSize = 3;

    //adjust font size based on container width and word count
    let fontSizeAdjustment = Math.max(baseFontSize - (wordCount / 10), 1);
    let newFontSize = Math.min(fontSizeAdjustment, containerWidth / 20);

    //apply the font size to all word blocks and drop boxes
    const wordElements = document.querySelectorAll('.word');
    const dropBoxElements = document.querySelectorAll('.drop-box');
    
    wordElements.forEach((word) => {
      word.style.fontSize = `${newFontSize}vw`;
    });

    dropBoxElements.forEach((dropBox) => {
        dropBox.style.fontSize = `${newFontSize * 0.9}vw`;
        dropBox.style.width = `${newFontSize * 1.2}vw`;
        dropBox.style.height = `${newFontSize * 1.5}vw`;

        dropBoxWidth = dropBox.style.width;
        dropBoxHeight = dropBox.style.height;      
    });
}


//making the guess boxes
function makeGuessBoxes() {
    grid.innerHTML = "";
    let counter = 0;
    for (let rows = 0; rows < MAX_GUESSES; rows++) {
        for (let col = 0; col < wordLength; col++) {
            const box = document.createElement('div');
            box.classList.add('box');
            grid.appendChild(box);
            ++counter;
        }
    }
    //console.log(`Created ${counter} boxes in ${MAX_GUESSES} rows for wordLength ${wordLength}`);
}

//generating the punctuation keyboard
function generateKeyboard() {
    keyboard.innerHTML = "";

    punctuation.forEach(p => {
        const key = document.createElement('button');
        key.textContent = p;
        key.classList.add('key');
        
        //making it draggable
        key.setAttribute('draggable', true);
        key.dataset.punctuation = p;

        //prevent drag for current guesses
        key.addEventListener('mousedown', (e) => {
            key.style.cursor = "grabbing";
            if (currentlyViewing !== -1) {
                showToast("Currently viewing a past guess");
                e.preventDefault();
            }
        });
key.addEventListener('mouseup', (e) => {
            key.style.cursor = "grab";
        });
        key.addEventListener('touchstart', (e) => {
            if (currentlyViewing !== -1) {
                showToast("Currently viewing a past guess");
                e.preventDefault();
            }
        });

        // Drag start event for mouse
        key.addEventListener('dragstart', (e) => {
            const draggedButton = e.target.cloneNode(true);

            //changing the size to match the drop boxes
            draggedButton.style.width = dropBoxWidth;
            draggedButton.style.height = dropBoxHeight;
            draggedButton.style.position = 'absolute';
            draggedButton.style.top = '-1000px';
            document.body.appendChild(draggedButton);
        
            e.dataTransfer.setData('text/plain', p);

            //the mouse is in the middle
            // const rect = draggedButton.getBoundingClientRect();
            // const offsetX = rect.width / 2;
            // const offsetY = rect.height / 2;

            // e.dataTransfer.setDragImage(draggedButton, offsetX, offsetY);

            e.dataTransfer.setDragImage(draggedButton, 0, 0);
        
            setTimeout(() => {
                document.body.removeChild(draggedButton);
            }, 0);
        });
        

        key.addEventListener('dragend', (e) => {
            const draggedButton = e.target;
            key.style.cursor = "grab";

            draggedButton.style.width = '';
            draggedButton.style.height = '';
            draggedButton.style.opacity = '';
        });

        //for touch devices
        key.addEventListener('touchstart', (e) => {
            // const draggedButton = e.target.cloneNode(true);
        });

        keyboard.appendChild(key);
    });
}


//styling the see in sentence buttons
//30 grid rows
function createGrid() {
    const gridRows = document.querySelectorAll('.box');
    //console.log("createGrid box count: ", gridRows.length);

    lastBoxes = [];

    for (let m = 1; m < gridRows.length+1; m++) {
        if ((m % (wordLength) == 0) && m != 0) {
            //last one keep it
            lastBoxes.push(gridRows[m-1]);
        }
    }
}

//Loop through each row and align the buttons vertically
function alignButtons() {
    lastBoxes.forEach((row, index) => {        
        const button = viewSentenceButtons[index];
        
        const rect = row.getBoundingClientRect();
        button.style.top = `${rect.top + 20}px`;
        button.style.left = `${rect.right + 10}px`;
    });
}

function isValidPunctuationCountForLevel(punctuationCount){
    if (level === 'easy' && punctuationCount != 3) {
        return false;
    } else if (level === 'medium' && punctuationCount != 4) {
        return false;
    } else if (level === 'hard' && punctuationCount < 5) {
        return false;
    }
    return true;
}

//removing the punctuation from the sentence
function removePunctuation(text) {
    let punctuationCount = 0;

    //replace dashes
    const dashReplacedText = text.replace(/(?<=\w)-(?=\w)/g, (match) => {
        punctuationCount++;
        return ' ';
    });

    //other
    const punctuationRegex = /[!"(),.:;?]/g;
    let newSentence = dashReplacedText.replace(punctuationRegex, (match) => {
        punctuationCount++;
        return '';
    });
    
    if (!isValidPunctuationCountForLevel(punctuationCount))
        return false;
    
    //removing the specific number of punctuation
    // const indicesToRemove = new Set();
    // while (indicesToRemove.size < removeCount) {
    //     const randomIndex = Math.floor(Math.random() * punctuationMatches.length);
    //     indicesToRemove.add(punctuationMatches[randomIndex].index);
    // }

    // let specialSentence = '';
    // for (let i = 0; i < text.length; i++) {
    //     if (indicesToRemove.has(i)) {
    //         specialSentence += ' ';
    //     } else {
    //         specialSentence += text[i];
    //     }
    // }

    wordLength = punctuationCount;
    cleanedSentence = newSentence;
    
    renderSentenceWithDropBoxes(cleanedSentence);

    //console.log("gridTemplateColumns: ", punctuationCount);
    document.getElementById("grid").style.gridTemplateColumns = `repeat(${punctuationCount}, 5vw)`;

    return true;
    // return { cleanedSentence, punctuationCount };
}

function getCorrectAnswer() {
    const punctuationRegex = /[.,!?;:\-]/;
    
    correctPunctuation = [];
    let buffer = '';

    for (let i = 0; i < originalText.length; i++) {
        const char = originalText[i];

        if (punctuationRegex.test(char)) {
            // If punctuation is found, save the word and punctuation together
            correctPunctuation.push({ word: buffer, punctuation: char });
            buffer = '';
        } else if (char === ' ') {
            // Only add space if there is an actual word before it
            if (buffer.length > 0) {
                correctPunctuation.push({ word: buffer, punctuation: ' ' });
                buffer = '';
            }
        } else {
            buffer += char;  // Accumulate word characters
        }
    }

    // Handle any remaining word at the end of the loop
    if (buffer.length > 0) {
        correctPunctuation.push({ word: buffer, punctuation: '' });
    }

    //console.log("correct answer: ", correctPunctuation);
}

//adding dropboxes
function renderSentenceWithDropBoxes(text) {
    sentence.innerHTML = '';
    const words = text.trim().split(/\s+/);

    words.forEach((word, index) => {
        const wordBlock = document.createElement('div');
        wordBlock.classList.add('word-block');

        const wordSpan = document.createElement('span');
        wordSpan.classList.add('word');
        wordSpan.textContent = word;

        const dropBox = document.createElement('div');
        dropBox.classList.add('drop-box');
        dropBox.setAttribute('draggable', false);
        dropBox.setAttribute('data-index', index);

        dropBox.addEventListener('dragover', (e) => e.preventDefault());

        dropBox.addEventListener('drop', (e) => {
            e.preventDefault();
            const punctuation = e.dataTransfer.getData('text/plain');
        
            if (punctuation && dropBox.textContent === '') {
                dropBox.textContent = punctuation;
                const index = dropBox.getAttribute('data-index');
                addToGrid(punctuation, index);


                punctuationCount++;
                if (punctuationCount === wordLength) {
                    disableKeyboard();
                    //disableDropBoxes();
                }

                dropBox.setAttribute('draggable', true);
            }


            // if (draggedDropBox && draggedDropBox !== dropBox) {
            //     draggedDropBox.textContent = '';
            // }
            // draggedDropBox = null;

        });

        dropBox.addEventListener('mousedown', (e) => {
            if (currentlyViewing !== -1) {
                showToast("Currently viewing a past guess");
                e.preventDefault();
            }
        });

        dropBox.addEventListener('touchstart', (e) => {
            if (currentlyViewing !== -1) {
                showToast("Currently viewing a past guess");
                e.preventDefault();
            }
        });

        //dragging it out of the box
        dropBox.addEventListener('dragstart', (e) => {
            if (dropBox.textContent !== '') {
                const punc = dropBox.textContent;
                e.dataTransfer.setData('text/plain', punc);
        
                //drag image
                const draggedClone = dropBox.cloneNode(true);
                draggedClone.style.position = 'absolute';
                draggedClone.style.top = '-1000px';
                document.body.appendChild(draggedClone);
        
                const rect = draggedClone.getBoundingClientRect();
                
                //mouse in top left
                const offsetX = 0;
                const offsetY = 0;
        
                e.dataTransfer.setDragImage(draggedClone, offsetX, offsetY);
        
                //remove the clone after drag starts
                setTimeout(() => {
                    document.body.removeChild(draggedClone);
                }, 0);
        
                dropBox.textContent = '';
                
                draggedDropBox = dropBox;
                
                const index = dropBox.getAttribute('data-index');
                removeFromGrid(punc, index);


                punctuationCount--;
                if (punctuationCount < wordLength) {
                    enableKeyboard();
                    enableDropBoxes();
                }
            }
        });           

        //touch screen
        dropBox.addEventListener('touchstart', (e) => {
            if (dropBox.textContent !== '') {
                const punc = dropBox.textContent;
                dropBox.textContent = '';
                removeFromGrid(punc);
                punctuationCount--;
                if (punctuationCount < wordLength) {
                    enableKeyboard();
                    enableDropBoxes();
                }
            }
        });

        wordBlock.appendChild(wordSpan);
        wordBlock.appendChild(dropBox);
        sentence.appendChild(wordBlock);
    });

    adjustFontSize();
}

//sorting chronologically
function addToGrid(punctuation, index) {
    //remove old one
    const oldIndex = punctuationIndexes.indexOf(index);
    if (oldIndex > -1) {
        punctuationIndexes.splice(oldIndex, 1);
        dropBoxPunctuation = dropBoxPunctuation.filter(p => p.index !== index);
    }

    //adding
    punctuationIndexes.push(index);
    punctuationIndexes.sort((a, b) => a - b);
    
    dropBoxPunctuation.push({ punctuation, index });
    dropBoxPunctuation.sort((a, b) => a.index - b.index);

    updateUserPunctuation(index);
    updateGridFromArray();
}


function updateUserPunctuation(index) {
    //userPunctuation[index] = dropBoxPunctuation[index];
    //userPunctuation[index] = dropBoxPunctuation[index] ? dropBoxPunctuation[index].punctuation : 'nnn';
}

//remove from the grid
function removeFromGrid(punctuation, index) {
    const puncIndex = dropBoxPunctuation.findIndex(p => p.punctuation === punctuation && p.index == index);
    if (puncIndex > -1) {
        dropBoxPunctuation.splice(puncIndex, 1);
    }

    const idxIndex = punctuationIndexes.indexOf(index);
    if (idxIndex > -1) {
        punctuationIndexes.splice(idxIndex, 1);
    }
    updateGridFromArray();
}


function updateGridFromArray() {
    const boxes = document.querySelectorAll('.box');
    let row = (currentGuess * wordLength);


    boxes.forEach((box, i) => {
        if (i >= row && i < row + wordLength) {
            const specialIndex = i - row;
            box.textContent = dropBoxPunctuation[specialIndex] ? dropBoxPunctuation[specialIndex].punctuation : '';
        }
    });
}

//disabling the dropboxes
function disableDropBoxes() {
    const dropBoxes = document.querySelectorAll('.drop-box');
    
    dropBoxes.forEach(dropBox => {
        dropBox.setAttribute('draggable', false);
        dropBox.classList.add('disabled');
    });
}


//re-enabling the dropboxes
function enableDropBoxes() {
    const dropBoxes = document.querySelectorAll('.drop-box');
    
    dropBoxes.forEach(dropBox => {
        dropBox.setAttribute('draggable', true);
        dropBox.classList.remove('disabled');
    });
}

//disabling the keyboard
function disableKeyboard() {
    const keys = document.querySelectorAll('.key');
    keys.forEach(key => {
        key.setAttribute('draggable', false);
        key.classList.add('disabled');
    });
}

//re-enabling the keyboard
function enableKeyboard() {
    const keys = document.querySelectorAll('.key');
    keys.forEach(key => {
        key.setAttribute('draggable', true);
        key.classList.remove('disabled');
    });
}


function createUserArray() {
    const userPunctuation = [];

    //loop through each drop box and get the punctuation inside
    const dropBoxElements = document.querySelectorAll('.drop-box');
    dropBoxElements.forEach(dropBox => {
        const punctuation = dropBox.textContent.trim();

        //only add non-empty punctuation to the array
        if (punctuation !== '') {
            userPunctuation.push(punctuation);
        } else {
            userPunctuation.push('');
        }
    });

    return userPunctuation;
}



//changing the colors based on correct or not
function comparePunctuation() {
    //console.log("comparePunctuation: " + gameOver);
    if (!gameOver) {
        if (punctuationCount == wordLength) {
            if (!submitted && currentlyViewing == -1) {
                disableDropBoxes();
                let correctOnlyPunctuation = correctPunctuation.map(item => item.punctuation);
                const userOnlyPunctuation = createUserArray();

                const guessBoxes = document.querySelectorAll('.box');
                const currentGuessBoxes = Array.from(guessBoxes).slice(currentGuess * wordLength, (currentGuess + 1) * wordLength);

                const enteredIndices = dropBoxPunctuation.map(p => parseInt(p.index));

                let correctCopy = correctOnlyPunctuation;

                //changing the color of the user guesses (grid)
                currentGuessBoxes.forEach((box, i) => {
                    const globalIndex = enteredIndices[i];
                    if (globalIndex === undefined) return;

                    const userPunc = userOnlyPunctuation[globalIndex];
                    const correctPunc = correctOnlyPunctuation[globalIndex];

                    if (userPunc === correctPunc) {
                        box.style.backgroundColor = 'green';
                        correctCopy[globalIndex] = null;
                        userOnlyPunctuation[globalIndex] = null;
                    }
                });

                // Apply grays and yellows (grid)
                currentGuessBoxes.forEach((box, i) => {
                    if (box.style.backgroundColor) return;

                    const globalIndex = enteredIndices[i];
                    if (globalIndex === undefined) return;

                    const userPunc = userOnlyPunctuation[globalIndex];

                    if (userPunc && correctCopy.includes(userPunc)) {
                        box.style.backgroundColor = 'yellow';
                        const matchIndex = correctCopy.indexOf(userPunc);
                        correctCopy[matchIndex] = null;
                    } else {
                        box.style.backgroundColor = 'gray';
                    }
                });


                //something is wrong with the dropboxes
                //doing it all again for the dropboxes
                const correctPunctuationList = correctPunctuation.map(item => item.punctuation);
                const userPunctuationList = createUserArray();
                const dropBoxElements = document.querySelectorAll('.drop-box');
                const dropBoxIndices = dropBoxPunctuation.map(p => parseInt(p.index));

                //const dropBoxColors = [];
                const correctPunctuationCopy = correctPunctuationList.slice();

                //green
                dropBoxIndices.forEach((index, i) => {
                    if (index === undefined) return;

                    const dropBox = dropBoxElements[index];
                    const userPunctuation = userPunctuationList[index];
                    const correctPunctuation = correctPunctuationList[index];

                    if (userPunctuation === correctPunctuation) {
                        dropBox.style.backgroundColor = 'green';
                        colors[i] = "green";
                        correctPunctuationCopy[index] = null;
                        userPunctuationList[index] = null;

                        //fullColors[currentGuess][index] = 'green';
                    }
                });

                //grays and yellows
                dropBoxIndices.forEach((index, i) => {
                    if (index === undefined) return;

                    const dropBox = dropBoxElements[index];

                    //don't run if green
                    if (dropBox.style.backgroundColor == "green") {
                        return;
                    }

                    const userPunctuation = userPunctuationList[index];

                    if (userPunctuation && correctPunctuationCopy.includes(userPunctuation)) {
                        dropBox.style.backgroundColor = 'yellow';
                        colors[i] = "yellow";

                        const matchIndex = correctPunctuationCopy.indexOf(userPunctuation);
                        correctPunctuationCopy[matchIndex] = null;

                        //fullColors[currentGuess][index] = 'yellow';
                    } else {
                        dropBox.style.backgroundColor = 'gray';
                        colors[i] = "gray";

                        //fullColors[currentGuess][index] = 'gray';
                    }
                });

                if (currentGuess <= 5) {
                    currentGuess++;
                }

                submitted = true;

                // Add the current guess to guesses array
                const currentGuessArray = Array(wordLength).fill('');
                dropBoxPunctuation.forEach(({ punctuation, index }, i) => {
                    if (i < wordLength) {
                        currentGuessArray[i] = punctuation;
                    }
                });
                guesses.push(currentGuessArray);
                fullPunctuationIndexes.push(punctuationIndexes);

                console.log("currentGuessArray", currentGuessArray);
                console.log("punctuationIndexes", punctuationIndexes);
                console.log("colors", colors);
                fullColors.push(colors);

                let count = 0;
                const dropBoxes = document.querySelectorAll('.drop-box');

                dropBoxes.forEach(dropBox => {
                    if (dropBox.style.backgroundColor == 'green') {
                        count++;
                    }
                });

                if (count == wordLength) {
                    gameOver = true;
                    endGame(true);
                } else {
                    if (currentGuess > 5) {
                        gameOver = true;
                        endGame(false);
                    }
                }               
            } else {
                //if currently viewing shake the button of what is moving
                if (currentlyViewing != -1) {
                    let button = document.getElementById("see" + currentlyViewing);
                
                    button.classList.add('shake');
            
                    button.addEventListener('animationend', () => {
                        button.classList.remove('shake');
                    }, { once: true });
                }

                showToast("Currently viewing a past guess");
            }

            if (gameOver) {
                enableSeeGuessButtons(currentGuess);
            }
        } else {
            //not enough punctuation so shake the boxes
            const boxes = document.querySelectorAll('.box');
            const start = currentGuess * wordLength;
            const end = start + wordLength;
        
            for (let i = start; i < end; i++) {
                const box = boxes[i];
                box.classList.add('shake');
        
                // Remove the shake effect after it finishes
                box.addEventListener('animationend', () => {
                    box.classList.remove('shake');
                }, { once: true });
            }


            showToast("Not enough punctuation");
        }
    }
}

//reseting all data for next guess
function resetData() {
    //allowing the user to click see in sentence
    enableSeeGuessButtons(currentGuess);

    const dropBoxes = document.querySelectorAll('.drop-box');

    dropBoxes.forEach(dropBox => {
        dropBox.textContent = '';
        dropBox.style.backgroundColor = '';
    });

    nextGuessPressed = false;

    dropBoxPunctuation = [];
    userPunctuation = [];

    punctuationCount = 0;
    submitted = false;
    
    punctuationInBoxes = [];
    dropBoxPunctuation = [];

    punctuationIndexes = [];

    colors = [];

    userPunctuation = [];
}

//going to the next guess
document.getElementById("nextGuess").addEventListener('click', () => {
    if (submitted && !gameOver) {
        //if they clicked the see in sentence button
        for (let j = 1; j <= 6; j++) {
            if (document.getElementById("see" + j).textContent == "Hide sentence") {
                document.getElementById("see" + j).textContent = "See in sentence";
                //document.getElementById("see" + j).setAttribute("state", "active");
            }
        }

        nextGuessPressed = true;

        resetData();

        if (!(currentGuess <= 5)) {
            gameOver = true;
            endGame(false)
            //disable the dragging
            disableKeyboard();
            disableDropBoxes();
        }

        renderSentenceWithDropBoxes(cleanedSentence);

        enableKeyboard();
        enableDropBoxes();
    }
});

//enabling each button after enter is clicked
function enableSeeGuessButtons(index) {
    const button = document.getElementById("see" + index);
    button.setAttribute("state", "active");

    if (gameOver) {
        document.getElementById("see" + index).textContent = "Hide sentence";
        document.getElementById("see" + index).setAttribute("state", "highlight");
    }
}


//event listeners for the see in sentence buttons (seeInSetence)
viewSentenceButtons.forEach(button => {
    button.addEventListener('click', function(event) {
        
        //if (button.state)
        const dropBoxElements = document.querySelectorAll('.drop-box');

        let id = event.target.id;
    
        if (document.getElementById(id).textContent === "See in sentence") {
            document.getElementById(id).setAttribute("state", "highlight");
            
            currentlyViewing = id.substring(3);

            let ran = false;

            //if a second see is clicked change all the others to see
            //the one just clicked hasnt been changed to hide yet
            for (let j = 1; j <= 6; j++) {
                if (document.getElementById("see" + j).textContent == "Hide sentence") {
                    document.getElementById("see" + j).textContent = "See in sentence";
                    document.getElementById("see" + j).setAttribute("state", "active")                    
                    ran = true;
                }
            }

            if (ran) {
                dropBoxElements.forEach((dropBox, index) => {
                    //reverting it back to what it was                   
                    dropBox.textContent = currentSentencePunctuation[index];
                    dropBox.style.backgroundColor = currentColors[index];
                });

                currentSentencePunctuation = [];
                currentColors = [];
            }

            //turn off the dragging
            disableKeyboard();
            disableDropBoxes();

            //before making it appear get the current
            //getting the current color also
            dropBoxElements.forEach((dropBox) => {               
                currentSentencePunctuation.push(dropBox.textContent);
                currentColors.push(window.getComputedStyle(dropBox).backgroundColor);
            });

            //make it appear
            document.getElementById(id).textContent = "Hide sentence";
            
            let buttonIndex = id.substring(3) - 1;
                        
            console.log("buttonIndex", buttonIndex);
            console.log("fullPunctuationIndexes", fullPunctuationIndexes[buttonIndex]);
            console.log("guesses", guesses[buttonIndex]);
            console.log("fullColors", fullColors[buttonIndex])
            //if something is currently in there then the box content doesnt change
            
            //adding the punctuation to the sentence
            let didItRun = false;
            dropBoxElements.forEach((dropBox, index) => {
                didItRun = false;

                for (let i = 0; i < fullPunctuationIndexes[buttonIndex].length; i++) {
                    if (index == fullPunctuationIndexes[buttonIndex][i]) {
                        //the drop box matches the location of the punctuation
                        dropBox.textContent = guesses[buttonIndex][i];
                        dropBox.style.backgroundColor = fullColors[buttonIndex][i];

                        didItRun = true;
                        continue;

                    } else {
                        //last run through
                        if (i == (fullPunctuationIndexes[buttonIndex].length-1) && !didItRun) {                            
                            dropBox.textContent = '';
                            dropBox.style.backgroundColor = 'white';
                        }
                    }
                }                
            });            
        } else {
            document.getElementById(id).setAttribute("state", "active");

            //enable the keyboard
            enableKeyboard();
            enableDropBoxes();

            //hide it
            document.getElementById(id).textContent = "See in sentence";
            
            dropBoxElements.forEach((dropBox, index) => {
                //reverting it back to what it was
                if (!gameOver) {
                    dropBox.textContent = currentSentencePunctuation[index];
                    dropBox.style.backgroundColor = 'white';
                    //dropBox.style.backgroundColor = currentColors[index];
                } else {
                    //game is over
                    dropBox.textContent = '';
                    dropBox.style.backgroundColor = 'white';
                }
            });

            currentSentencePunctuation = [];
            currentColors = [];

            currentlyViewing = -1;            
        }
    });
});


function showToast(message) {
    //console.log("Toast: " + message);
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    
    //wait two seconds
    setTimeout(() => {
        toast.classList.remove("show");
    }, 2000);
}


function endGame(winner) {    
    //console.log("Game over", winner, currentGuess);
    updateStats(winner, currentGuess);

    document.getElementById('nextGuess').disabled = true;
    disableKeyboard();
    disableDropBoxes();

    openStats();
}

function updateStats(won, numGuesses){
    if (won){
        incrementLocalStorage(mode + ":win:" + numGuesses);
        incrementLocalStorage(mode + ":win");
        if (mode == "daily")
            localStorage.setItem("d:" + getDailyChallengeDate(), 1);                    
    } else {
        incrementLocalStorage(mode + ":loss");
        if (mode == "daily")
            localStorage.setItem("d:" + getDailyChallengeDate(), 0);
    }
}

function incrementLocalStorage(key){
    let value = getFromLocalStorage(key);
    localStorage.setItem(key, value + 1);

     //localStorage.setItem('user', JSON.stringify(userArray));
    //const userData = JSON.parse(localStorage.getItem('user'));
}

function getFromLocalStorage(key){
    let value = localStorage.getItem(key);
    return value === null ? 0 : Number(value);
}



/*

function dragElement(elmnt) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  elmnt.onmousedown = function (e) {
    e.preventDefault();
    pos3 = e.clientX; pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = dragMouseMove;
    elmnt.style.cursor = "grabbing";
  }

  function dragMouseMove(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    document.onmouseup = document.onmousemove = null;
elmnt.style.cursor = "grab";
    }
  }
  dragElement(document.getElementById("overlay1"))
  dragElement(document.getElementById("overlay2"));


*/
 
 
 
 
 
