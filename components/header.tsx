"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { Level, NUM_LEVELS } from "@/lib/level";
import { isNumeric } from "@/lib/utils";

export default function Header({
    levelNum,
    level,
    levelCompleted,
}: {
    levelNum: string;
    level: Level;
    levelCompleted: boolean;
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
                    <p className="text-center">{level.name}</p>
                    {/* <p>
                        <span className="font-bold">Goal:</span>{" "}
                        {level.initialWord} → {level.targetWord}
                    </p> */}
                </header>
                <div className="flex flex-row-reverse gap-4 text-lg">
                    {/* // <Button
                        //     className="bg-blue-500"
                        //     onClick={() => (location.href = `/${levelNum + 1}`)}
                        // >
                        //     Next
                        // </Button> */}
                    {levelNumInt !== null && (
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
                    )}
                </div>
            </div>
        </div>
    );
}
