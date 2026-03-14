import Header from "@/components/header";
import LevelPage from "@/components/level";
import LevelLayout from "@/components/level-layout";
import { Button } from "@/components/ui/button";
import { Level } from "@/lib/level";
import { isNumeric } from "@/lib/utils";
import Link from "next/link";

export default async function Page({
    params,
}: {
    params: Promise<{ level: string }>;
}) {
    const { level: levelNum } = await params;

    const response = await fetch(
        `${process.env.BASE_URL}/levels/${isNumeric(levelNum) ? "level" : ""}${levelNum}.json`,
    );

    const level: Level = await response.json();

    return <LevelLayout editor={false} level={level} levelNum={levelNum} />;
}
