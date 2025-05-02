//dashes work
//shaking doesnt work
//parethenses and quation marks have been removed
//when you click see in sentence while viewing a guess that you just entered it messes everything up (colors)

const sentence = document.getElementById("sentence");
let originalText = "the man";
let punctuationCount = 0;

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

//possible punctuation
const punctuation = ['.', ',', '?', '!', ';', ':', '-'];

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

let updated = [];

let viewSentenceButtons = document.querySelectorAll('.viewSentence');


//generate random sentence and whole screen
getRandomSentence();

function getRandomSentence() {
    fetch('sentences.txt')
        .then(function(response) {
            //check if it got it
            if (!response.ok) {
                console.error('Failed to load the file');
                return;
            }
            return response.text();
        })
        .then(function(text) {
            //split the text into sentences and choose one randomly
            const sentences = text.split('\n').map(sentence => sentence.trim()).filter(sentence => sentence !== '');
            const randomIndex = Math.floor(Math.random() * sentences.length);
            const randomSentence = sentences[randomIndex];

            //pass the random sentence to the next method
            console.log(randomSentence);
            originalText = randomSentence;

            //originalText = "the man-walked to school"

            removePunctuation(originalText)
            makeGuessBoxes();
            createGrid();
            alignButtons();
            generateKeyboard(); 
            getCorrectAnswer();
        })
        .catch(function(error) {
            console.error('Error:', error);
        });

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
    for (let rows = 0; rows < 6; rows++) {
        for (let col = 0; col < wordLength; col++) {
            const box = document.createElement('div');
            box.classList.add('box');
            grid.appendChild(box);
        }

    }
}

//generating the punctuation keyboard
function generateKeyboard() {
    punctuation.forEach(p => {
        const key = document.createElement('button');
        key.textContent = p;
        key.classList.add('key');
        
        //making it draggable
        key.setAttribute('draggable', true);
        key.dataset.punctuation = p;

        //prevent drag for current guesses
        key.addEventListener('mousedown', (e) => {
            if (currentlyViewing !== -1) {
                showToast("Currently viewing a past guess");
                e.preventDefault();
            }
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

    //updated = [];

    for (let m = 1; m < gridRows.length+1; m++) {
        if ((m % (wordLength) == 0) && m != 0) {
            //last one keep it
            updated.push(gridRows[m-1]);
            console.log("updated pushed");
        }
    }
}


//Loop through each row and align the buttons vertically
function alignButtons() {
    console.log(updated);
    updated.forEach((row, index) => {
        const button = viewSentenceButtons[index];
        const rect = row.getBoundingClientRect();
        const centerTop = rect.top + rect.height / 2;
        const vhTop = (centerTop / window.innerHeight) * 100;

        button.style.top = `${vhTop}vh`;
        button.style.left = '50%';
        button.style.transform = 'translate(-20%, -380%)';

        console.log("this ran");
    });


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

    //checking to see if it's enough punctuation
    let removeCount;

    if (level === 'easy') {
        removeCount = 3;
    } else if (level === 'medium') {
        removeCount = 4;
    } else if (level === 'hard') {
        if (punctuationCount >= 5) {
            removeCount = punctuationCount; // Remove all
        } else {
            console.log("Not enough punctuation for hard");
            getRandomSentence();
            return;
        }
    }
    
    if (punctuationCount < removeCount) {
        console.log("Not enough punctuation to remove");
        getRandomSentence();
        return;
    }

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

    wordLength = removeCount;
    cleanedSentence = newSentence;
    
    renderSentenceWithDropBoxes(cleanedSentence);

    document.getElementById("grid").style.gridTemplateColumns = `repeat(${punctuationCount}, 5vw)`;


    return { cleanedSentence, punctuationCount };


    //return { newSentence, punctuationCount };
}

function getCorrectAnswer() {
    const punctuationRegex = /[.,!?;:'"\-\(\)\*]/;
    
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

    console.log("correct answer");
    console.log(correctPunctuation);
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
    if (!gameOver) {
        if (punctuationCount == wordLength) {
            if (!submitted && currentlyViewing == -1) {

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
                const correctPunctuationCopy = correctPunctuationList;

                console.log(correctPunctuationList);
                console.log(userPunctuationList);

                //green
                dropBoxIndices.forEach((index, i) => {
                    if (index === undefined) return;

                    const dropBox = dropBoxElements[index];
                    const userPunctuation = userPunctuationList[index];
                    const correctPunctuation = correctPunctuationList[index];

                    console.log(userPunctuation);
                    console.log(correctPunctuation);
                    if (userPunctuation === correctPunctuation) {
                        dropBox.style.backgroundColor = 'green';
                        colors.push('green');
                        correctPunctuationCopy[index] = null;
                        userPunctuationList[index] = null;

                        //fullColors[currentGuess][index] = 'green';
                    }
                });

                //grays and yellows
                dropBoxIndices.forEach((index, i) => {
                    if (index === undefined) return;

                    const dropBox = dropBoxElements[index];

                    console.log("style" + dropBox.style.background);
                    //don't run if green
                    if (dropBox.style.backgroundColor == "green") {
                        return;
                    }

                    const userPunctuation = userPunctuationList[index];

                    if (userPunctuation && correctPunctuationCopy.includes(userPunctuation)) {
                        console.log("yellow");

                        dropBox.style.backgroundColor = 'yellow';
                        colors.push('yellow');

                        const matchIndex = correctPunctuationCopy.indexOf(userPunctuation);
                        correctPunctuationCopy[matchIndex] = null;

                        //fullColors[currentGuess][index] = 'yellow';
                    } else {
                        console.log("gray");

                        dropBox.style.backgroundColor = 'gray';
                        colors.push('gray');

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

                console.log("colors: ");
                console.log(colors);

        
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



//when the user clicks enter change the color
document.getElementById('enter-button').addEventListener('click', comparePunctuation);


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
                //document.getElementById("see" + j).style.backgroundColor = 'rgb(105, 102, 102)';
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
    button.removeAttribute('disabled');
    button.style.cursor = "allowed";

    if (gameOver) {
        document.getElementById("see" + index).textContent = "Hide sentence";
        document.getElementById("see" + index).style.backgroundColor = 'red';
    }
}


//event listeners for the see in sentence buttons
const buttons = document.querySelectorAll('.viewSentence');

buttons.forEach(button => {
    button.addEventListener('click', function(event) {
        const dropBoxElements = document.querySelectorAll('.drop-box');

        let id = event.target.id;
    
        if (document.getElementById(id).textContent === "See in sentence") {
            document.getElementById(id).style.backgroundColor = 'red';


            currentlyViewing = id.substring(3);

            let ran = false;

            //if a second see is clicked change all the others to see
            //the one just clicked hasnt been changed to hide yet
            for (let j = 1; j <= 6; j++) {
                if (document.getElementById("see" + j).textContent == "Hide sentence") {
                    document.getElementById("see" + j).textContent = "See in sentence";
                    document.getElementById("see" + j).style.backgroundColor = 'rgb(105, 102, 102)';


                    ran = true;
                }

            }

            if (ran) {
                dropBoxElements.forEach((dropBox, index) => {
                    //reverting it back to what it was
                    
                    dropBox.textContent = currentSentencePunctuation[index];
                    dropBox.style.backgroundColor = 'currentColors[index]';
    
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
            
            id = id.substring(3) - 1;
            
            
            //if something is currently in there then the box content doesnt change
            
            //adding the punctuation to the sentence
            let didItRun = false;
            dropBoxElements.forEach((dropBox, index) => {
                didItRun = false;

                for (let i = 0; i < fullPunctuationIndexes[id].length; i++) {

                    if (index == fullPunctuationIndexes[id][i]) {
                        //the drop box matches the location of the punctuation
                        dropBox.textContent = guesses[id][i];

                        console.log(guesses[id][i]);
                        console.log(fullColors[id]);
                        dropBox.style.backgroundColor = fullColors[id][i];

                        didItRun = true;
                        continue;

                    } else {
                        //last run through
                        if (i == (fullPunctuationIndexes[id].length-1) && !didItRun) {
                            
                            dropBox.textContent = '';
                            dropBox.style.backgroundColor = 'white';

                        }
                    }
                }
                

            });

            
        } else {
            document.getElementById(id).style.backgroundColor = 'rgb(105, 102, 102)';

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
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    
    //wait two seconds
    setTimeout(() => {
        toast.classList.remove("show");
    }, 2000);
}


function endGame(winner) {
    console.log(winner);
    document.getElementById('nextGuess').disabled = true;
    console.log(document.getElementById('nextGuess').disabled);


    disableKeyboard();
    disableDropBoxes();
}