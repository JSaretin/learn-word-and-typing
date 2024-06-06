export interface Meaning {
    [key: string]: any;
}




export interface RawWordData {
    meanings: (string | string[])[][];
    antonyms: string[];
    synonyms: string[];
    word: string;
}

export interface WordData {
    word: string;
    meaning: RawWordData;
    liked: boolean;
    disliked: boolean;
    checked_meaning: boolean
}