import sys
import re
#import nltk
#from nltk.tokenize import sent_tokenize
#import spacy

allowed_punctuation = {',', '.', '?', '!', ';', ':'}

def replace_multiple_with_one(text, chars):    
    pattern = r'([' + re.escape(chars) + r'])\1+'
    return re.sub(pattern, r'\1', text)
    
def process(inputfile, outputfile):
    #nltk.download('punkt') # Run this line once to download the necessary resources

    book_id = inputfile.split('.')[0]
    punctuation_str = ''.join(c for c in allowed_punctuation)
    
    with open(inputfile, 'r', encoding='utf-8') as input: 
        content = input.read()

    content = content.replace("\n", " ")
    
    sentenceRe = r"(?<!\w\.\w)(?<![A-Z][a-z]\.)(?<=\.|\?|!)\s"
    sentences = re.split(sentenceRe, content)
    
    #nltk
    #sentences = sent_tokenize(content)
    
    #spacy
    #nlp = spacy.load("en_core_web_sm")
    #doc = nlp(content)
    #sentences = [sent.text for sent in doc.sents]
    
    out = open(outputfile, 'w', encoding='utf-8')
    counter = 0    
    for sentence in sentences:
        sentence = sentence.strip()
        sentence = replace_multiple_with_one(sentence, " ")
        sentence = replace_multiple_with_one(sentence, punctuation_str)
        
        num_words, num_punct = check_setence(sentence)
        if num_words < 5 or num_punct < 3:
            continue
        
        mode = None
        if num_punct == 3 and num_words < 10:
            mode = 'easy'
        elif num_punct == 4 and num_words < 15:
            mode = 'medium'
        elif num_punct >= 5 and num_words < 20:
            mode = 'hard'
        else:
            continue
            
        out.write(f'{book_id}|{mode}|{sentence}\n')
        counter += 1
        if (counter < 100):
            print(f'{num_words},{num_punct},{mode},"{sentence}"')
                
    out.close()

def check_setence(sentence):
    if len(sentence) < 20:
        return (0, 0)
    if sentence[0].islower():
        return (0, 0)
    if "Mr." in sentence or "Mrs." in sentence or "Ms." in sentence or "St." in sentence:
        return (0, 0)
        
    num_punct = 0
    num_spaces = 0
    prev_c_punct = True
    for c in sentence:
        if c in allowed_punctuation:
            if prev_c_punct:
                return (0, 0)
            num_punct += 1
            prev_c_punct = True
            if c == '-':
                num_spaces += 1
        elif c == ' ':
            num_spaces += 1
            prev_c_punct = False
        elif not c.isalpha():
            return (0, 0)
        else:
            prev_c_punct = False
            
    return (num_spaces + 1, num_punct)
            
def main():   
    if len(sys.argv) < 2:
        jsonfile.write("Usage: python process.py <input>")
        sys.exit(1)

    process(sys.argv[1], 'out.dat')

if __name__ == "__main__":
    main()