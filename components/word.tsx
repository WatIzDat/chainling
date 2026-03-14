import { Level } from "@/lib/level";
import { RefObject } from "react";

export default function Word({
    word,
    wordIndex,
    refs,
    affectedIndices,
    // level,
    wordConfigs,
    measure,
}: {
    word: string;
    wordIndex: number;
    refs: RefObject<Array<HTMLDivElement | null>>;
    affectedIndices: number[][];
    // level: Level;
    wordConfigs: { initialWord: string; targetWord: string }[];
    measure?: boolean;
}) {
    return (
        <div
            key={wordIndex}
            ref={(el) => {
                refs.current[wordIndex] = el;
            }}
            className={`flex flex-col gap-4 items-center justify-center ${measure ? "fixed invisible w-auto" : "w-1/2 h-1/2"}`}
        >
            <div className="text-center">
                {[...word].map((letter, i) => (
                    <span
                        key={i}
                        className={`transition-colors ${
                            affectedIndices[wordIndex]?.includes(i)
                                ? "text-muted-foreground"
                                : "text-inherit"
                        }`}
                    >
                        {letter}
                    </span>
                ))}
            </div>
            <div className="text-lg font-normal text-center">
                <span className="font-bold">Goal:</span>{" "}
                {wordConfigs[wordIndex].initialWord} →{" "}
                {wordConfigs[wordIndex].targetWord}
            </div>
        </div>
    );
}
