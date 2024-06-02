export interface Meaning {
    [key: string]: any;
}

export interface WordData {
    word: string;
    meaning: any;
    liked: boolean;
    disliked: boolean;
    checked_meaning: boolean
}