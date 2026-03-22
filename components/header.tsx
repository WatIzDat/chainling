"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { Level, NUM_LEVELS } from "@/lib/level";
import { isNumeric } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import Form from "next/form";
import { Field } from "./ui/field";
import { Dispatch, SetStateAction } from "react";

export default function Header({
    editor,
    levelNum,
    levelName,
    levelCompleted,
    levelVerified,
    levelCode,
    setLevel,
}:
    | {
          editor: false;
          levelNum: string;
          levelName: string;
          levelCompleted: boolean;
          levelVerified?: undefined;
          levelCode?: undefined;
          setLevel?: undefined;
      }
    | {
          editor: true;
          levelNum: string;
          levelName: string;
          levelCompleted?: undefined;
          levelVerified: boolean;
          levelCode: string;
          setLevel: Dispatch<SetStateAction<Level | undefined>>;
      }) {
    const levelNumInt = isNumeric(levelNum) ? Number.parseInt(levelNum) : null;

    return (
        <div>
            <div className="flex flex-col lg:grid lg:grid-cols-3 items-center justify-between px-4 pt-4 lg:px-12 lg:pt-12">
                <nav className="flex gap-4 text-lg">
                    <Link className="text-5xl p-2 font-light" href="/">
                        chain→ling
                    </Link>
                </nav>
                <header className="flex flex-col items-center text-lg">
                    <h1 className="font-bold text-4xl">
                        {levelNumInt === null ? "" : "Level "}
                        {levelNum}
                    </h1>
                    <p className="text-center">{levelName}</p>
                </header>
                <div className="flex flex-row-reverse gap-4 text-lg">
                    {editor ? (
                        <>
                            <Dialog>
                                <DialogTrigger
                                    className={`text-3xl px-2 pt-2 lg:pb-2 ${levelVerified ? "block lg:visible" : "hidden lg:invisible"}`}
                                >
                                    export
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>export level</DialogTitle>
                                    </DialogHeader>
                                    <code className="rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono overflow-auto">
                                        {levelCode}
                                    </code>
                                </DialogContent>
                            </Dialog>
                            <Dialog>
                                <DialogTrigger
                                    className={`text-3xl px-2 pt-2 lg:pb-2`}
                                >
                                    import
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>import level</DialogTitle>
                                    </DialogHeader>
                                    <Form
                                        action={(e) => {
                                            // console.log(e.get("levelCode"));

                                            setLevel(
                                                JSON.parse(
                                                    e
                                                        .get("levelCode")
                                                        ?.toString()!,
                                                ),
                                            );
                                        }}
                                    >
                                        <Field>
                                            <Textarea
                                                className="rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono overflow-auto"
                                                placeholder="paste level code here"
                                                name="levelCode"
                                            />
                                        </Field>
                                        <Field>
                                            <Button type="submit">
                                                import
                                            </Button>
                                        </Field>
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </>
                    ) : (
                        levelNumInt !== null && (
                            <Link
                                className={`text-3xl px-2 pt-2 lg:pb-2 ${levelCompleted ? "block lg:visible" : "hidden lg:invisible"}`}
                                href={
                                    levelNumInt === NUM_LEVELS
                                        ? "/end"
                                        : `/${levelNumInt + 1}`
                                }
                            >
                                next
                            </Link>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
