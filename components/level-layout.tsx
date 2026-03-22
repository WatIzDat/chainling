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
    const [verified, setVerified] = useState(false);
    const [levelCode, setLevelCode] = useState("");
    const [importedLevel, setImportedLevel] = useState<Level>();

    return (
        <div className="grid grid-rows-[auto_1fr] min-h-svh">
            {editor ? (
                <Header
                    editor={true}
                    levelNum={"editor"}
                    levelName={"make your own level!"}
                    levelVerified={verified}
                    levelCode={levelCode}
                    setLevel={setImportedLevel}
                />
            ) : (
                <Header
                    editor={false}
                    levelNum={levelNum}
                    levelName={level.name}
                    levelCompleted={completed}
                />
            )}
            {editor ? (
                <LevelPage
                    editor={true}
                    setVerified={setVerified}
                    setLevelCode={setLevelCode}
                    level={importedLevel}
                />
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
