import PlayLink from "@/components/play-link";
import { NUM_LEVELS } from "@/lib/level";
import Link from "next/link";

export default async function Home() {
    // const numLevels = 15;

    return (
        <main className="flex flex-col gap-6 min-h-svh min-w-svw items-center justify-center p-12 text-3xl">
            <header className="text-center">
                <h1 className="text-7xl md:text-8xl lg:text-9xl font-light mb-6">
                    chain→ling
                </h1>
                <p className="font-extralight">
                    the puzzle game about sound change
                </p>
            </header>
            <PlayLink />
            <div className="mt-6">
                <h2 className="font-extralight mb-6">levels</h2>
                <div
                    className={`grid grid-cols-4 grid-rows-${Math.ceil(NUM_LEVELS / 4)} gap-6`}
                >
                    {[...Array(NUM_LEVELS)].map((_, i) => (
                        <Link key={i} href={`/${i + 1}`}>
                            {i + 1}
                        </Link>
                    ))}
                </div>
            </div>
            <footer className="mt-6">
                <Link href="/credits">credits</Link>
            </footer>
        </main>
    );
}
