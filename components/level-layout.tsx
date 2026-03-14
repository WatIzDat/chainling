"use client";

import { Level } from "@/lib/level";
import Header from "./header";
import LevelPage from "./level";
import { useState } from "react";

export default function LevelLayout({
    editor,
    level,
    levelNum,
}:
    | {
          editor: false;
          level: Level;
          levelNum: string;
      }
    | {
          editor: true;
          level?: undefined;
          levelNum?: undefined;
      }) {
    const [completed, setCompleted] = useState(false);

    return (
        <div className="grid grid-rows-[auto_1fr] min-h-svh">
            <Header
                levelNum={editor ? "editor" : levelNum}
                levelName={editor ? "make your own level!" : level.name}
                levelCompleted={completed}
            />
            {editor ? (
                <LevelPage editor={true} />
            ) : (
                <LevelPage
                    editor={false}
                    levelNum={levelNum}
                    level={level}
                    setCompleted={setCompleted}
                />
            )}
        </div>
    );
}
