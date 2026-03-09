import Link from "next/link";

export default function Page() {
    return (
        <main className="flex flex-col gap-6 min-h-svh w-screen items-center justify-center p-12 text-3xl text-center">
            <header>
                <h1 className="text-7xl md:text-8xl lg:text-9xl font-light mb-6">
                    congrats!
                </h1>
                <p className="font-extralight">
                    you have completed all levels :)
                </p>
            </header>
            <p className="font-extralight">
                hope you enjoyed, and more levels are to come!{" "}
            </p>
            <p className="font-extralight">
                please consider sharing the game and giving it a star on github.
                it really helps me out!
            </p>
            <div className="flex gap-4">
                <Link href="https://github.com/WatIzDat/linguistics-game">
                    github
                </Link>
                <Link href="/">home</Link>
            </div>
        </main>
    );
}
