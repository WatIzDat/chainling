"use client";

import { Rule, applyRule, applyRules, formatRule } from "@/lib/rule";
import { move } from "@dnd-kit/helpers";
import { DragDropProvider, useDraggable, useDroppable } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import {
    useState,
    useEffect,
    Dispatch,
    SetStateAction,
    useRef,
    RefObject,
    CSSProperties,
    Fragment,
    PointerEventHandler,
    MouseEventHandler,
} from "react";
import { Button } from "./ui/button";
import { CollisionPriority } from "@dnd-kit/abstract";
import { Level, NUM_LEVELS } from "@/lib/level";
import { clearTimeout, setTimeout } from "timers";
import {
    closestCenter,
    pointerIntersection,
    directionBiased,
} from "@dnd-kit/collision";
import { motion } from "motion/react";
import { InfoIcon, RotateCcwIcon } from "lucide-react";
import { Howl, Howler } from "howler";
import { usePrevious } from "@/lib/utils";
import { isEqual } from "lodash-es";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "./ui/tooltip";
import {
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTrigger,
} from "./ui/popover";
import {
    HybridTooltip,
    HybridTooltipContent,
    HybridTooltipTrigger,
} from "./ui/hybrid-tooltip";
import Word from "./word";

function SortableButton({
    ref,
    children,
    id,
    index,
    group,
    className,
    style,
    onHover,
    onLeave,
    onClick,
}: {
    ref?: RefObject<Element | null>;
    children: React.ReactNode;
    id: number;
    index: number;
    group: string;
    className?: string;
    style?: CSSProperties;
    onHover?: PointerEventHandler<HTMLButtonElement>;
    onLeave?: PointerEventHandler<HTMLButtonElement>;
    onClick?: MouseEventHandler<HTMLButtonElement>;
}) {
    const { ref: sortableRef, isDragging } = useSortable({
        id,
        index,
        type: "item",
        accept: "item",
        group,
        // collisionDetector: pointerIntersection,
    });

    // function refs(node: Element | null) {
    //     sortableRef(node);

    //     if (ref) {
    //         ref.current = node;
    //     }
    // }

    return (
        <Button
            ref={sortableRef}
            className={className}
            style={style}
            data-dragging={isDragging}
            onPointerOver={onHover}
            onPointerLeave={onLeave}
            onClick={onClick}
        >
            {children}
        </Button>
    );
}

// function UnsortableButton({
//     children,
//     id,
//     className,
//     style,
// }: {
//     children: React.ReactNode;
//     id: number;
//     className?: string;
//     style?: CSSProperties;
// }) {
//     const { ref } = useDraggable({ id });

//     return (
//         <Button ref={ref} className={className} style={style}>
//             {children}
//         </Button>
//     );
// }

function Column({
    ref,
    style,
    children,
    id,
    className,
}: {
    ref?: RefObject<Element | null>;
    style?: CSSProperties;
    children: React.ReactNode;
    id: string;
    className?: string;
}) {
    const { ref: sortableRef } = useDroppable({
        id,
        type: "column",
        accept: "item",
        collisionPriority: CollisionPriority.Low,
    });

    function refs(node: Element | null) {
        sortableRef(node);

        if (ref) {
            ref.current = node;
        }
    }

    return (
        <div className={className} ref={refs} style={style}>
            {children}
        </div>
    );
}

// function Slot({ index }: { index: number }) {
//     const { ref } = useDroppable({
//         id: `slot-${index}`,
//         type: "column",
//         accept: "item",
//         collisionPriority: CollisionPriority.High,
//         // collisionDetector: ,
//     });

//     return (
//         <div
//             ref={ref}
//             className="row-start-1 col-start-1 size-full bg-input rounded-xl text-center content-center text-muted-foreground select-none"
//             // style={{
//             //     gridRowStart: (index % 5) + 1,
//             //     gridColumnStart: index / 5 + 1,
//             // }}
//         >
//             {index}
//         </div>
//     );
// }

export default function LevelPage({
    level,
    levelNum,
    setCompleted,
}: {
    level: Level;
    levelNum: number;
    setCompleted: Dispatch<SetStateAction<boolean>>;
}) {
    // const rules = [
    //     { id: 0, rule: { pattern: "p", replacement: "f" } },
    //     { id: 1, rule: { pattern: "t", replacement: "d" } },
    // ];

    const rules = level.rules.map((rule, i) => ({ id: i, rule }));

    const [items, setItems] = useState<{
        bank: { id: number; rule: Rule }[];
        solution: { id: number; rule: Rule }[];
    }>({
        bank: rules,
        solution: [],
    });

    // const initialWord = level.initialWord;
    // const targetWord = level.targetWord;

    const [words, setWords] = useState(level.words.map((w) => w.initialWord));

    const [affectedIndices, setAffectedIndices] = useState<number[][]>([]);

    const [viewedRuleIndex, setViewedRuleIndex] = useState<number | null>(null);

    const [success, setSuccess] = useState(false);
    // const [completed, setCompleted] = useState(false);
    const isFirstSuccessRef = useRef(true);

    // const [timeoutID, setTimeoutID] = useState<NodeJS.Timeout | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [timelineHeaderVisible, setTimelineHeaderVisible] = useState(true);

    const pickupSounds = [
        new Howl({ src: ["sounds/cursor1.mp3"] }),
        // new Howl({ src: ["sounds/cursor2.mp3"] }),
    ];

    const dropSounds = [
        new Howl({ src: ["sounds/swipe1.mp3"], volume: 0.5 }),
        new Howl({ src: ["sounds/swipe2.mp3"], volume: 0.5 }),
    ];

    const swapSound = new Howl({ src: ["sounds/cursor2.mp3"] });

    const successSound = new Howl({ src: ["sounds/success.mp3"] });

    Howler.volume(0.5);

    const prevItems = usePrevious(items);

    useEffect(() => {
        // console.log(items);
        setTimelineHeaderVisible(items.solution.length <= 0);

        const newWords =
            viewedRuleIndex === null
                ? words.map((w, i) =>
                      applyRules(
                          items.solution.map((x) => x.rule),
                          level.words[i].initialWord,
                      ),
                  )
                : words.map((w, i) =>
                      applyRules(
                          items.solution
                              .slice(0, viewedRuleIndex + 1)
                              .map((x) => x.rule),
                          level.words[i].initialWord,
                      ),
                  );

        setWords(newWords);

        if (!isEqual(items, prevItems)) {
            swapSound.play();
        }

        let allEqual = true;

        for (let i = 0; i < newWords.length; i++) {
            // console.log(newWords[i]);
            // console.log(level.words[i].targetWord);
            if (newWords[i] !== level.words[i].targetWord) {
                allEqual = false;

                break;
            }
        }

        if (allEqual) {
            if (timeoutRef.current !== null) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                setSuccess(true);

                setCompleted(true);

                if (isFirstSuccessRef.current) {
                    successSound.play();
                }

                isFirstSuccessRef.current = false;

                if (levelNum === NUM_LEVELS) {
                    localStorage.removeItem("level");
                } else {
                    localStorage.setItem("level", (levelNum + 1).toString());
                }
            }, 1000);
        } else {
            // console.log("not success");
            setSuccess(false);

            if (timeoutRef.current !== null) {
                clearTimeout(timeoutRef.current);

                timeoutRef.current = null;
            }
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [items]);

    // const [ruleButtonHeight, setRuleButtonHeight] = useState(0);
    // const ruleButtonRef = useRef<HTMLElement | null>(null);

    // useEffect(() => {
    //     setRuleButtonHeight(ruleButtonRef.current?.clientHeight!);
    // });

    // const [timelineHeight, setTimelineHeight] = useState(0);
    // const timelineRef = useRef<HTMLDivElement | null>(null);

    // useEffect(() => {
    //     setTimelineHeight(timelineRef.current?.clientHeight!);
    // });

    // const snapshot = useRef(structuredClone(items));

    const wordRefs = [...Array(level.words.length)].map((_) =>
        useRef<HTMLDivElement>(null),
    );

    const measureRefs = [...Array(level.words.length)].map((_) =>
        useRef<HTMLDivElement>(null),
    );
    // console.log(wordRefs);
    const [isWordOverflowing, setIsWordOverflowing] = useState(
        [...Array(level.words.length)].map((_) => false),
    );

    useEffect(() => {
        wordRefs.forEach((ref, i) => {
            const el = ref.current;
            const measure = measureRefs[i].current;

            if (!el || !measure) {
                return;
            }

            const check = (i: number) => {
                // const clone = el.cloneNode(true) as HTMLElement;
                // const computed = getComputedStyle(el).fontSize;

                // // Array.from(computed).forEach((key) => {
                // //     clone.style.setProperty(
                // //         key,
                // //         computed.getPropertyValue(key),
                // //     );
                // // });

                // Object.assign(clone.style, {
                //     position: "fixed",
                //     visibility: "hidden",
                //     width: "auto",
                //     overflow: "visible",
                //     top: "-9999px",
                //     fontSize: computed,
                // });

                // // clone.ref = null;

                // document.body.appendChild(clone);
                // const isOverflowing = clone.scrollWidth > el.clientWidth - 50;
                // document.body.removeChild(clone);

                const isOverflowing = measure.scrollWidth > el.clientWidth - 50;

                // console.log(words[i] + " " + measure.scrollWidth);
                // console.log(words[i] + " " + el.clientWidth);
                // console.log(
                //     isWordOverflowing.map((_, j) =>
                //         j === i ? isOverflowing : isWordOverflowing[j],
                //     ),
                // );

                setIsWordOverflowing((prev) =>
                    prev.map((_, j) => (j === i ? isOverflowing : prev[j])),
                );
            };

            console.log(i);
            const observer = new ResizeObserver(() => check(i));
            observer.observe(el);
            check(i);

            return () => observer.disconnect();
        });
    }, [words]);

    return (
        <DragDropProvider
            onDragStart={(event) => {
                pickupSounds[
                    Math.floor(Math.random() * pickupSounds.length)
                ].play();
            }}
            onDragEnd={(event) => {
                dropSounds[
                    Math.floor(Math.random() * dropSounds.length)
                ].play();
            }}
            // onCollision={(event) => {
            //     // console.log(event.collisions);
            //     if (
            //         event.collisions
            //             .slice(1)
            //             .find((c) => Number.isInteger(c.id))
            //     ) {
            //         pickupSounds[
            //             Math.floor(Math.random() * pickupSounds.length)
            //         ].play();
            //     }
            // }}
            onDragOver={(event) => {
                setItems((items) => move(items, event));

                // console.log(event.operation.target);
                // if (isSortable(event.operation.source)) {
                //     if (event.operation.source.group) {
                //         pickupSounds[
                //             Math.floor(Math.random() * pickupSounds.length)
                //         ].play();
                //     }
                // }
            }}
        >
            {/* <div>{isWordOverflowing ? "Overflow" : "Not overflow"}</div> */}
            <main className="min-h-0 grid grid-cols-2 lg:max-2xl:grid-cols-[2fr_1fr] grid-rows-[1fr_auto] gap-4 lg:gap-12 bg-background p-4 lg:p-12 sm:items-start">
                {/* <div className="h-1/2 w-full flex items-center justify-center"> */}
                <motion.div
                    // ref={timelineRef}
                    layout
                    className="col-start-1 col-end-2 row-start-2 row-end-3 lg:row-start-1 lg:row-end-2 flex flex-col lg:flex-row gap-4 h-full min-h-0 overflow-auto bg-secondary rounded-4xl"
                    onClick={(event) => {
                        if (
                            // event.target === event.currentTarget &&
                            viewedRuleIndex !== null
                        ) {
                            // console.log("test");
                            // setWords(
                            //     applyRules(
                            //         items.solution.map((x) => x.rule),
                            //         initialWord,
                            //     ),
                            // );

                            setWords(
                                words.map((w, i) =>
                                    applyRules(
                                        items.solution.map((x) => x.rule),
                                        level.words[i].initialWord,
                                    ),
                                ),
                            );

                            setViewedRuleIndex(null);
                        }
                    }}
                >
                    <div className="flex flex-col justify-center lg:justify-between">
                        <h2
                            className={`text-3xl font-semibold text-center lg:text-left lg:ml-6 mt-6 lg:absolute 2xl:static ${timelineHeaderVisible ? "lg:visible" : "lg:invisible"} 2xl:visible`}
                        >
                            Timeline
                        </h2>
                        <Button
                            className="ml-6 mb-6 max-2xl:hidden"
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                                setItems({
                                    bank: rules,
                                    solution: [],
                                })
                            }
                        >
                            <RotateCcwIcon />
                        </Button>
                    </div>
                    {/* <div
                        className="size-full grid grid-rows-5 gap-4 p-4"
                        style={{
                            gridTemplateColumns: `repeat(${Math.ceil(
                                level.rules.length / 5,
                            )}, 1fr)`,
                        }}
                    >
                        {rules.map(
                            (rule, i) => (
                                <div
                                    key={rule.id}
                                    className="grid grid-rows-1 grid-cols-1"
                                    style={{
                                        gridRowStart: (i % 5) + 1,
                                        gridColumnStart: i / 5 + 1,
                                    }}
                                >
                                    <Slot index={i} />
                                    {items.solution[i] !== null && (
                                        <SortableButton
                                            // ref={i === 0 ? ruleButtonRef : undefined}
                                            // key={items.solution[i].id}
                                            id={items.solution[i].id}
                                            index={
                                                items.solution
                                                    .slice(0, i)
                                                    .filter(
                                                        (rule) => rule !== null,
                                                    ).length
                                            }
                                            group="solution"
                                            className="row-start-1 col-start-1 size-full p-2 md:p-4 lg:p-6 text-lg select-none"
                                            // style={{
                                            //     gridRowStart: (i % 5) + 1,
                                            //     gridColumnStart: i / 5 + 1,
                                            // }}
                                        >
                                            {formatRule(items.solution[i].rule)}
                                        </SortableButton>
                                    )}
                                </div>
                            ),
                            // : (
                            //     <Slot index={i} key={`slot-${rule.id}`} />
                            // ),
                        )}
                    </div> */}

                    <Column
                        id="solution"
                        className="lg:h-full w-full h-[50svh] flex flex-col gap-1 xl:gap-4 p-4 items-center lg:place-items-center lg:grid lg:grid-rows-5 lg:grid-flow-col overflow-auto"
                        style={{
                            gridTemplateColumns: `repeat(${Math.ceil(
                                level.rules.length / 5,
                            )}, 1fr)`,
                        }}
                    >
                        {items.solution.map((rule, i) => (
                            <SortableButton
                                // ref={i === 0 ? ruleButtonRef : undefined}
                                key={rule.id}
                                id={rule.id}
                                index={i}
                                group="solution"
                                className={`h-fit lg:h-full w-full text-xs md:text-sm md:p-4 lg:text-base xl:text-xl select-none ${viewedRuleIndex !== null && i <= viewedRuleIndex ? "bg-muted-foreground" : ""} ${viewedRuleIndex !== null && i === viewedRuleIndex ? "border-white border-4" : ""}`}
                                onClick={(event) => {
                                    event.stopPropagation();

                                    setWords(
                                        viewedRuleIndex === i
                                            ? words.map((w, j) =>
                                                  applyRules(
                                                      items.solution.map(
                                                          (x) => x.rule,
                                                      ),
                                                      level.words[j]
                                                          .initialWord,
                                                  ),
                                              )
                                            : words.map((w, j) =>
                                                  applyRules(
                                                      items.solution
                                                          .slice(0, i + 1)
                                                          .map(
                                                              (rule) =>
                                                                  rule.rule,
                                                          ),
                                                      level.words[j]
                                                          .initialWord,
                                                  ),
                                              ),
                                    );

                                    setViewedRuleIndex(
                                        viewedRuleIndex === i ? null : i,
                                    );
                                }}
                                // className="size-fit p-2 md:p-4 lg:p-6 text-base lg:text-lg select-none"
                                // style={{
                                //     gridRowStart: (i % 5) + 1,
                                //     gridColumnStart: i / 5 + 1,
                                // }}
                            >
                                {formatRule(rule.rule)}
                            </SortableButton>
                        ))}
                    </Column>
                </motion.div>
                <motion.div
                    layout
                    className={`relative transition-colors col-start-1 col-end-3 row-start-1 row-end-2 lg:col-start-2 flex lg:max-2xl:flex-col lg:max-2xl:flex-nowrap ${isWordOverflowing.includes(true) ? "flex-col flex-nowrap" : "flex-wrap"} ${words.length === 2 && "flex-col"} h-full items-center justify-center text-5xl ${words.length === 2 && "lg:text-7xl"} ${words.length > 2 ? "2xl:text-9xl" : "lg:text-9xl"} font-bold ${success && "text-green-500"}`}
                >
                    {words.map((word, wordIndex) => (
                        <Fragment key={wordIndex}>
                            <Word
                                word={word}
                                wordIndex={wordIndex}
                                refs={wordRefs}
                                affectedIndices={affectedIndices}
                                level={level}
                            />
                            <Word
                                word={word}
                                wordIndex={wordIndex}
                                refs={measureRefs}
                                affectedIndices={affectedIndices}
                                level={level}
                                measure
                            />
                        </Fragment>
                    ))}
                    <Button
                        className="ml-6 mb-6 2xl:hidden absolute top-0 right-0"
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                            setItems({
                                bank: rules,
                                solution: [],
                            })
                        }
                    >
                        <RotateCcwIcon />
                    </Button>
                    {levelNum >= 5 && (
                        <HybridTooltip>
                            <HybridTooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden ml-6 mt-6 absolute bottom-0 right-0"
                                >
                                    <InfoIcon />
                                </Button>
                            </HybridTooltipTrigger>
                            <HybridTooltipContent
                                className="w-fit bg-black text-white"
                                side="left"
                            >
                                <p>V: a, e, i, o, and u</p>
                                <p>C: everything else</p>
                            </HybridTooltipContent>
                        </HybridTooltip>
                    )}
                </motion.div>
                {/* </div> */}
                <motion.div
                    layout
                    className="col-start-2 lg:col-start-1 col-end-3 row-start-2 row-end-3 flex flex-col gap-4 h-full bg-secondary rounded-4xl min-h-50 overflow-auto"
                >
                    <div className="md:grid md:grid-cols-3 lg:flex lg:justify-between">
                        <h2 className="col-start-2 text-3xl font-semibold text-center lg:text-left lg:ml-6 mt-6">
                            Changes
                        </h2>
                        {levelNum >= 5 && (
                            <HybridTooltip>
                                <HybridTooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="max-md:hidden mr-6 mt-6 ml-auto"
                                    >
                                        <InfoIcon />
                                    </Button>
                                </HybridTooltipTrigger>
                                <HybridTooltipContent
                                    className="w-fit bg-black text-white"
                                    side="top"
                                >
                                    <p>V: a, e, i, o, and u</p>
                                    <p>C: everything else</p>
                                </HybridTooltipContent>
                            </HybridTooltip>
                        )}
                    </div>
                    <Column
                        id="bank"
                        className="h-full w-full flex flex-col lg:flex-row flex-nowrap lg:flex-wrap overflow-auto gap-1 md:gap-2 lg:gap-4 p-4 items-center lg:justify-center"
                    >
                        {items.bank.map((rule, i) => (
                            <SortableButton
                                // ref={i === 0 ? ruleButtonRef : undefined}
                                key={rule.id}
                                id={rule.id}
                                index={i}
                                group="bank"
                                className="w-full h-fit lg:size-fit md:p-4 lg:p-6 text-xs md:text-sm lg:text-base xl:text-lg select-none"
                                onHover={() =>
                                    setAffectedIndices(
                                        words.map(
                                            (w) => applyRule(rule.rule, w)[1],
                                        ),
                                    )
                                }
                                onLeave={() => setAffectedIndices([])}
                            >
                                {formatRule(rule.rule)}
                            </SortableButton>
                        ))}
                    </Column>
                </motion.div>
                {/* {completed && (
                    <Button
                        className="ml-auto bg-blue-500 w-20 h-12"
                        onClick={() => (location.href = `/${levelNum + 1}`)}
                    >
                        Next
                    </Button>
                )} */}
            </main>
        </DragDropProvider>
    );
}
