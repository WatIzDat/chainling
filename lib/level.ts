import { Rule } from "./rule";

export const NUM_LEVELS = 15;

export interface Level {
    name: string;
    words: {
        initialWord: string;
        targetWord: string;
    }[];
    rules: Rule[];
}
