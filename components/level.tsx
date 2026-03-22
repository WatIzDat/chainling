"use client";

import { Rule, applyRule, applyRules, formatRule } from "@/lib/rule";
import { move } from "@dnd-kit/helpers";
import { DragDropProvider, useDroppable } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
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
    ButtonHTMLAttributes,
    ClassAttributes,
    forwardRef,
    useCallback,
} from "react";
import { Button } from "./ui/button";
import { CollisionPriority } from "@dnd-kit/abstract";
import { Level, NUM_LEVELS } from "@/lib/level";
import { clearTimeout, setTimeout } from "timers";
import { motion } from "motion/react";
import {
    Edit2Icon,
    InfoIcon,
    PlusIcon,
    RotateCcwIcon,
    Trash2Icon,
    TrashIcon,
} from "lucide-react";
import { Howl, Howler } from "howler";
import { isNumeric } from "@/lib/utils";
import { isEqual, max } from "lodash-es";
import {
    HybridTooltip,
    HybridTooltipContent,
    HybridTooltipTrigger,
} from "./ui/hybrid-tooltip";
import Word from "./word";
import { usePrevious } from "@/lib/hooks";
import {
    Popover,
    PopoverContent,
    PopoverHeader,
    PopoverTrigger,
} from "./ui/popover";
import { Field, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import Form from "next/form";
import RulePopover from "./rule-popover";

const SortableButton = forwardRef(
    (
        {
            children,
            sortableId,
            index,
            group,
            className,
            onClick,
            ...props
        }: {
            children: React.ReactNode;
            sortableId: number;
            index: number;
            group: string;
            className?: string;
            onClick?: MouseEventHandler<HTMLButtonElement>;
        } & React.ComponentProps<"button">,
        forwardedRef,
    ) => {
        const { ref: sortableRef, isDragging } = useSortable({
            id: sortableId,
            index,
            type: "item",
            accept: "item",
            group,
        });

        const mergedRef = useCallback(
            (node: Element | null) => {
                sortableRef(node);

                if (typeof forwardedRef === "function") {
                    forwardedRef(node);
                } else if (forwardedRef) {
                    forwardedRef.current = node;
                }
            },
            [forwardedRef],
        );

        return (
            <Button
                ref={mergedRef}
                className={className}
                data-dragging={isDragging}
                onClick={onClick}
                {...props}
            >
                {children}
            </Button>
        );
    },
);

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

export default function LevelPage({
    editor,
    level,
    levelNum,
    setCompleted,
    setVerified,
    setLevelCode,
}:
    | {
          editor: false;
          level: Level;
          levelNum: string;
          setCompleted: Dispatch<SetStateAction<boolean>>;
          setVerified?: undefined;
          setLevelCode?: undefined;
      }
    | {
          editor: true;
          level?: Level | undefined;
          levelNum?: undefined;
          setCompleted?: undefined;
          setVerified: Dispatch<SetStateAction<boolean>>;
          setLevelCode: Dispatch<SetStateAction<string>>;
      }) {
    // if (editor) {
    //     const [createdLevel, setCreatedLevel] = useState();
    // }

    if (editor) {
        useEffect(() => {
            if (!level) {
                return;
            }

            setRules!(level.rules.map((rule, i) => ({ id: i, rule })));
            setWordConfigs!(
                level.words.map((w, i) => ({
                    id: i,
                    initialWord: w.initialWord,
                    targetWord: w.targetWord,
                })),
            );
        }, [level]);
    }

    const [rules, setRules] = editor
        ? useState<{ id: number; rule: Rule }[]>([])
        : [level.rules.map((rule, i) => ({ id: i, rule })), null];

    const maxRuleIdRef = editor ? useRef(0) : null;

    const [items, setItems] = useState<{
        bank: { id: number; rule: Rule }[];
        solution: { id: number; rule: Rule }[];
    }>({
        bank: rules,
        solution: [],
    });

    if (editor) {
        const prevRules = usePrevious(rules);

        useEffect(() => {
            const addedRules = rules.filter(
                (rule) => !prevRules?.map((r) => r.id).includes(rule.id),
            );
            const removedRules = prevRules?.filter(
                (rule) => !rules.map((r) => r.id).includes(rule.id),
            );

            maxRuleIdRef!.current =
                max(addedRules.map((r) => r.id)) ?? maxRuleIdRef!.current;

            setItems({
                bank: [
                    ...items.bank
                        .filter(
                            (rule) =>
                                !removedRules
                                    ?.map((r) => r.id)
                                    .includes(rule.id),
                        )
                        .map((rule) => rules.find((r) => r.id === rule.id)!),
                    ...addedRules,
                ],
                solution: [
                    ...items.solution
                        .filter(
                            (rule) =>
                                !removedRules
                                    ?.map((r) => r.id)
                                    .includes(rule.id),
                        )
                        .map((rule) => rules.find((r) => r.id === rule.id)!),
                    // ...addedRules,
                ],
            });
        }, [rules]);
    }

    const [wordConfigs, setWordConfigs] = editor
        ? useState<{ id: number; initialWord: string; targetWord: string }[]>(
              [],
          )
        : [
              level.words.map((w, i) => ({
                  id: i,
                  initialWord: w.initialWord,
                  targetWord: w.targetWord,
              })),
              null,
          ];

    const [words, setWords] = useState<{ id: number; word: string }[]>(
        wordConfigs.map((w, i) => ({ id: i, word: w.initialWord })),
    );

    const maxWordIdRef = editor ? useRef(0) : null;

    if (editor) {
        useEffect(() => {
            setWords(
                wordConfigs.map((w) => ({
                    id: w.id,
                    word: w.initialWord,
                })),
            );

            maxWordIdRef!.current =
                max(wordConfigs.map((w) => w.id)) ?? maxWordIdRef!.current;

            console.log(words);

            wordRefs.current = [...Array(wordConfigs.length)].map((_) => null);
            measureRefs.current = [...Array(wordConfigs.length)].map(
                (_) => null,
            );

            isWordOverflowingRef.current = [...Array(wordConfigs.length)].map(
                (_) => false,
            );
            setIsWordOverflowing(
                [...Array(wordConfigs.length)].map((_) => false),
            );

            // wordRefs = [...Array(wordConfigs.length)].map((_) =>
            //     useRef<HTMLDivElement>(null),
            // );

            // measureRefs = [...Array(wordConfigs.length)].map((_) =>
            //     useRef<HTMLDivElement>(null),
            // );

            // isWordOverflowingRef = useRef(
            //     [...Array(wordConfigs.length)].map((_) => false),
            // );
            // [isWordOverflowing, setIsWordOverflowing] = useState(
            //     [...Array(wordConfigs.length)].map((_) => false),
            // );
        }, [wordConfigs]);
    }

    const [affectedIndices, setAffectedIndices] = useState<number[][]>([]);

    const [viewedRuleIndex, setViewedRuleIndex] = useState<number | null>(null);

    const [success, setSuccess] = useState(false);

    if (editor) {
        useEffect(() => {
            setVerified(success);

            if (success) {
                setLevelCode(
                    JSON.stringify({
                        name: "new level",
                        words: wordConfigs.map((w) => ({
                            initialWord: w.initialWord,
                            targetWord: w.targetWord,
                        })),
                        rules: rules.map((r) => r.rule),
                    }),
                );
            }
        }, [success]);
    }

    const isFirstSuccessRef = useRef(true);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [timelineHeaderVisible, setTimelineHeaderVisible] = useState(true);

    const pickupSounds = [new Howl({ src: ["sounds/cursor1.mp3"] })];

    const dropSounds = [
        new Howl({ src: ["sounds/swipe1.mp3"], volume: 0.5 }),
        new Howl({ src: ["sounds/swipe2.mp3"], volume: 0.5 }),
    ];

    const swapSound = new Howl({ src: ["sounds/cursor2.mp3"] });

    const successSound = new Howl({ src: ["sounds/success.mp3"] });

    Howler.volume(0.5);

    const prevItems = usePrevious(items);

    const levelNumInt = editor
        ? null
        : isNumeric(levelNum)
          ? Number.parseInt(levelNum)
          : null;

    useEffect(
        () => {
            setTimelineHeaderVisible(items.solution.length <= 0);

            let newWords = wordConfigs.map((w) => ({
                id: w.id,
                word: w.initialWord,
            }));

            newWords =
                viewedRuleIndex === null
                    ? newWords.map((w, i) => ({
                          id: w.id,
                          word: applyRules(
                              items.solution.map((x) => x.rule),
                              wordConfigs[i].initialWord,
                          ),
                      }))
                    : newWords.map((w, i) => ({
                          id: w.id,
                          word: applyRules(
                              items.solution
                                  .slice(0, viewedRuleIndex + 1)
                                  .map((x) => x.rule),
                              wordConfigs[i].initialWord,
                          ),
                      }));

            setWords(newWords);

            if (!isEqual(items, prevItems)) {
                swapSound.play();
            }

            let allEqual = true;

            for (let i = 0; i < newWords.length; i++) {
                if (newWords[i].word !== wordConfigs[i].targetWord) {
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

                    if (!editor) {
                        setCompleted(true);
                    }

                    if (isFirstSuccessRef.current) {
                        successSound.play();
                    }

                    isFirstSuccessRef.current = false;

                    if (levelNumInt !== null) {
                        if (levelNumInt === NUM_LEVELS) {
                            localStorage.removeItem("level");
                        } else {
                            localStorage.setItem(
                                "level",
                                (levelNumInt + 1).toString(),
                            );
                        }
                    }
                }, 1000);
            } else {
                setSuccess(false);

                if (timeoutRef.current !== null) {
                    clearTimeout(timeoutRef.current);

                    timeoutRef.current = null;
                }
            }

            return () => {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
            };
        },
        editor
            ? [items, viewedRuleIndex, wordConfigs]
            : [items, viewedRuleIndex],
    );

    const wordRefs = useRef<Array<HTMLDivElement | null>>(
        [...Array(wordConfigs.length)].map((_) => null),
    );
    const measureRefs = useRef<Array<HTMLDivElement | null>>(
        [...Array(wordConfigs.length)].map((_) => null),
    );

    // let wordRefs = [...Array(wordConfigs.length)].map((_) =>
    //     useRef<HTMLDivElement>(null),
    // );

    // let measureRefs = [...Array(wordConfigs.length)].map((_) =>
    //     useRef<HTMLDivElement>(null),
    // );

    const isWordOverflowingRef = useRef(
        [...Array(wordConfigs.length)].map((_) => false),
    );
    const [isWordOverflowing, setIsWordOverflowing] = useState(
        [...Array(wordConfigs.length)].map((_) => false),
    );

    useEffect(() => {
        const cleanup = wordRefs.current.map((ref, i) => {
            const el = ref;
            const measure = measureRefs.current[i];

            if (!el || !measure) {
                return () => {};
            }

            let timeout: ReturnType<typeof setTimeout>;

            const check = (i: number) => {
                clearTimeout(timeout!);
                timeout = setTimeout(() => {
                    const isOverflowing =
                        measure.scrollWidth > el.clientWidth - 50;

                    if (isWordOverflowingRef.current[i] !== isOverflowing) {
                        isWordOverflowingRef.current[i] = isOverflowing;
                        setIsWordOverflowing((prev) =>
                            prev.map((_, j) =>
                                j === i ? isOverflowing : prev[j],
                            ),
                        );
                    }
                }, 50);
            };

            const observer = new ResizeObserver(() => check(i));
            observer.observe(el);
            check(i);

            return () => {
                observer.disconnect();
                clearTimeout(timeout);
            };
        });

        return () => cleanup.forEach((c) => c());
    }, [words]);

    const [deleteMode, setDeleteMode] = editor ? useState(false) : [null, null];

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
            onDragOver={(event) => {
                setItems((items) => move(items, event));
            }}
        >
            <main className="min-h-0 grid grid-cols-2 lg:max-2xl:grid-cols-[2fr_1fr] grid-rows-[1fr_auto] gap-4 lg:gap-12 bg-background p-4 lg:p-12 sm:items-start">
                <motion.div
                    layout
                    className="col-start-1 col-end-2 row-start-2 row-end-3 lg:row-start-1 lg:row-end-2 flex flex-col lg:flex-row gap-4 h-full min-h-0 overflow-auto bg-secondary rounded-4xl"
                    onClick={(event) => {
                        if (viewedRuleIndex !== null) {
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
                    <Column
                        id="solution"
                        className="lg:h-full w-full h-[50svh] flex flex-col gap-1 xl:gap-4 p-4 items-center lg:place-items-center lg:grid lg:grid-rows-5 lg:grid-flow-col overflow-auto"
                        style={{
                            gridTemplateColumns: `repeat(${Math.ceil(
                                rules.length / 5,
                            )}, 1fr)`,
                        }}
                    >
                        {items.solution.map((rule, i) => (
                            <RulePopover
                                key={rule.id}
                                type="edit"
                                side="right"
                                customTrigger={(onClick) => (
                                    <SortableButton
                                        // key={rule.id}
                                        sortableId={rule.id}
                                        index={i}
                                        group="solution"
                                        className={`h-fit lg:h-full w-full text-xs md:text-sm md:p-4 lg:text-base xl:text-xl select-none ${viewedRuleIndex !== null && i <= viewedRuleIndex ? "bg-muted-foreground" : ""} ${viewedRuleIndex !== null && i === viewedRuleIndex ? "border-white border-4" : ""} ${deleteMode && "bg-red-500"} `}
                                        onClick={(event) => {
                                            event.stopPropagation();

                                            setViewedRuleIndex(
                                                viewedRuleIndex === i
                                                    ? null
                                                    : i,
                                            );

                                            deleteMode
                                                ? setRules!(
                                                      rules.filter(
                                                          (r) =>
                                                              r.id !== rule.id,
                                                      ),
                                                  )
                                                : onClick(event);
                                        }}
                                    >
                                        {formatRule(rule.rule)}
                                    </SortableButton>
                                )}
                                onSubmit={(
                                    pattern,
                                    replacement,
                                    environmentBefore,
                                    environmentAfter,
                                ) =>
                                    setRules!(
                                        rules.map((r) =>
                                            r.id === rule.id
                                                ? {
                                                      ...rule,
                                                      rule: {
                                                          pattern: pattern,
                                                          replacement:
                                                              replacement,
                                                          environment:
                                                              environmentBefore ||
                                                              environmentAfter
                                                                  ? `${environmentBefore} _ ${environmentAfter}`
                                                                  : null,
                                                      },
                                                  }
                                                : r,
                                        ),
                                    )
                                }
                            />
                        ))}
                    </Column>
                </motion.div>
                <motion.div
                    layout
                    className={`relative transition-colors col-start-1 col-end-3 row-start-1 row-end-2 lg:col-start-2 flex lg:max-2xl:flex-col lg:max-2xl:flex-nowrap ${isWordOverflowing.includes(true) ? "flex-col flex-nowrap" : "flex-wrap"} ${words.length === 2 && "flex-col"} h-full items-center justify-center text-5xl ${words.length === 2 && "lg:text-7xl"} ${words.length > 2 ? "2xl:text-9xl" : "lg:text-9xl"} font-bold ${success && "text-green-500"}`}
                >
                    {words.map((word, wordIndex) => (
                        <Fragment key={word.id}>
                            <Word
                                word={word.word}
                                wordIndex={wordIndex}
                                refs={wordRefs}
                                affectedIndices={affectedIndices}
                                // level={level}
                                wordConfigs={wordConfigs}
                            />
                            <Word
                                word={word.word}
                                wordIndex={wordIndex}
                                refs={measureRefs}
                                affectedIndices={affectedIndices}
                                // level={level}
                                wordConfigs={wordConfigs}
                                measure
                            />
                        </Fragment>
                    ))}
                    {editor && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost">
                                    <PlusIcon />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent side="left">
                                <PopoverHeader>add word</PopoverHeader>
                                <Form
                                    action={(e) => {
                                        console.log(e);

                                        setWordConfigs!([
                                            ...wordConfigs,
                                            {
                                                id: maxWordIdRef!.current + 1,
                                                initialWord:
                                                    e
                                                        .get("initialWord")
                                                        ?.toString() ?? "",
                                                targetWord:
                                                    e
                                                        .get("targetWord")
                                                        ?.toString() ?? "",
                                            },
                                        ]);
                                    }}
                                >
                                    <FieldGroup className="gap-4">
                                        <Field orientation="horizontal">
                                            <FieldLabel
                                                htmlFor="initialWord"
                                                className="w-1/2"
                                            >
                                                initial word
                                            </FieldLabel>
                                            <Input
                                                id="initialWord"
                                                name="initialWord"
                                            />
                                        </Field>
                                        <Field orientation="horizontal">
                                            <FieldLabel
                                                htmlFor="targetWord"
                                                className="w-1/2"
                                            >
                                                target word
                                            </FieldLabel>
                                            <Input
                                                id="targetWord"
                                                name="targetWord"
                                            />
                                        </Field>
                                        <Field>
                                            <Button type="submit">add</Button>
                                        </Field>
                                    </FieldGroup>
                                </Form>
                            </PopoverContent>
                        </Popover>
                    )}
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
                    {(levelNumInt === null || levelNumInt >= 5) && (
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
                <motion.div
                    layout
                    className="col-start-2 lg:col-start-1 col-end-3 row-start-2 row-end-3 flex flex-col gap-4 h-full bg-secondary rounded-4xl min-h-50 overflow-auto"
                >
                    <div className="md:grid md:grid-cols-3 lg:flex lg:justify-between">
                        <h2 className="col-start-2 text-3xl font-semibold text-center lg:text-left lg:ml-6 mt-6">
                            Changes
                        </h2>
                        {editor ? (
                            <div>
                                <Button
                                    variant="ghost"
                                    className="max-md:hidden mr-6 mt-6"
                                    onClick={() => setDeleteMode!(!deleteMode)}
                                >
                                    <TrashIcon />
                                </Button>
                                <RulePopover
                                    type="add"
                                    side="left"
                                    onSubmit={(
                                        pattern,
                                        replacement,
                                        environmentBefore,
                                        environmentAfter,
                                    ) =>
                                        setRules!([
                                            ...rules,
                                            {
                                                id: maxRuleIdRef!.current + 1,
                                                rule: {
                                                    pattern: pattern,
                                                    replacement: replacement,
                                                    environment:
                                                        environmentBefore ||
                                                        environmentAfter
                                                            ? `${environmentBefore} _ ${environmentAfter}`
                                                            : null,
                                                },
                                            },
                                        ])
                                    }
                                >
                                    <Button
                                        variant="ghost"
                                        className="max-md:hidden mr-6 mt-6"
                                    >
                                        <PlusIcon />
                                    </Button>
                                </RulePopover>
                            </div>
                        ) : (
                            (levelNumInt === null || levelNumInt >= 5) && (
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
                            )
                        )}
                    </div>
                    <Column
                        id="bank"
                        className="h-full w-full flex flex-col lg:flex-row flex-nowrap lg:flex-wrap overflow-auto gap-1 md:gap-2 lg:gap-4 p-4 items-center lg:justify-center"
                    >
                        {items.bank.map(
                            (rule, i) => (
                                <RulePopover
                                    key={rule.id}
                                    type="edit"
                                    side="top"
                                    customTrigger={(onClick) => (
                                        <SortableButton
                                            sortableId={rule.id}
                                            index={i}
                                            group="bank"
                                            className={`w-full h-fit lg:size-fit md:p-4 lg:p-6 text-xs md:text-sm lg:text-base xl:text-lg select-none ${deleteMode && "bg-red-500"}`}
                                            onClick={
                                                deleteMode
                                                    ? () =>
                                                          setRules!(
                                                              rules.filter(
                                                                  (r) =>
                                                                      r.id !==
                                                                      rule.id,
                                                              ),
                                                          )
                                                    : onClick
                                            }
                                            onPointerOver={() =>
                                                setAffectedIndices(
                                                    words.map(
                                                        (w) =>
                                                            applyRule(
                                                                rule.rule,
                                                                w.word,
                                                            )[1],
                                                    ),
                                                )
                                            }
                                            onPointerLeave={() =>
                                                setAffectedIndices([])
                                            }
                                        >
                                            {formatRule(rule.rule)}
                                        </SortableButton>
                                    )}
                                    onSubmit={(
                                        pattern,
                                        replacement,
                                        environmentBefore,
                                        environmentAfter,
                                    ) =>
                                        setRules!(
                                            rules.map((r) =>
                                                r.id === rule.id
                                                    ? {
                                                          ...rule,
                                                          rule: {
                                                              pattern: pattern,
                                                              replacement:
                                                                  replacement,
                                                              environment:
                                                                  environmentBefore ||
                                                                  environmentAfter
                                                                      ? `${environmentBefore} _ ${environmentAfter}`
                                                                      : null,
                                                          },
                                                      }
                                                    : r,
                                            ),
                                        )
                                    }
                                />
                            ),
                            // )
                            // : (
                            //     <SortableButton
                            //         key={rule.id}
                            //         sortableId={rule.id}
                            //         index={i}
                            //         group="bank"
                            //         className="w-full h-fit lg:size-fit md:p-4 lg:p-6 text-xs md:text-sm lg:text-base xl:text-lg select-none"
                            //         onPointerOver={() =>
                            //             setAffectedIndices(
                            //                 words.map(
                            //                     (w) =>
                            //                         applyRule(
                            //                             rule.rule,
                            //                             w.word,
                            //                         )[1],
                            //                 ),
                            //             )
                            //         }
                            //         onPointerLeave={() =>
                            //             setAffectedIndices([])
                            //         }
                            //     >
                            //         {formatRule(rule.rule)}
                            //     </SortableButton>
                            // ),
                        )}
                    </Column>
                </motion.div>
            </main>
        </DragDropProvider>
    );
}
