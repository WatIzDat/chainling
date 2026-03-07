import { escapeRegExp } from "lodash-es";

export interface Rule {
    pattern: string;
    replacement: string;
    environment?: string | null;
}

const naturalClassToRegex: { [k: string]: string } = {
    C: "[^aeiou]",
    V: "[aeiou]",
    // "[+voice]": "[bdgmn]",
    // "[-voice]": "[ptk]",
    // "[+nasal]": "[mn]",
    // "[-nasal]": "[ptkbdg]",
    // "[+high]": "[iu]",
    // "[-high]": "[aeo]",
    // "[+mid]": "[eo]",
    // "[-mid]": "[aiu]",
    // "[+low]": "[a]",
    // "[-low]": "[eiou]",
};

export function applyRule(
    rule: Rule,
    word: string,
): [word: string, changedIndices: number[]] {
    const naturalClassRe = new RegExp("\\[.*\\]|C|V", "g");

    if (!rule.environment) {
        let reStr = escapeRegExp(rule.pattern);

        [...reStr.matchAll(naturalClassRe)].map((match) => {
            reStr = reStr.replace(match[0], naturalClassToRegex[match[0]]);
        });

        const re = new RegExp(reStr, "g");

        // console.log(re);

        return [
            word.replaceAll(re, rule.replacement),
            [...word.matchAll(re)].flatMap((m) => {
                // console.log(m);
                return Array.from(
                    new Array(m[0].length),
                    (_, i) => i + m.index,
                );
            }),
        ];
    }

    const environment: (string | null)[] = rule.environment.split(" ");

    if (environment.length < 3) {
        if (environment[1] === "_") {
            environment.push(null);
        } else {
            environment.unshift(null);
        }
    }

    let left: string = "";
    let right: string = "";

    // if (environment.length === 3) {
    //     // re = new RegExp(
    //     //     `(?<=${environment[0]})${rule.pattern}(?=${environment[2]})`,
    //     //     "g",
    //     // );

    //     if (environment[0][0] === "#") {
    //         if (environment[0].length > 1) {
    //             left = `^(?<=${environment[0].substring(1)})`;
    //         } else {
    //             left = `^`;
    //         }
    //     } else {
    //         left = `(?<=${environment[0]})`;
    //     }

    //     if (environment[2][0] === "#") {
    //         if (environment[2].length > 1) {
    //             right = `(?=${environment[2].substring(1)})$`;
    //         } else {
    //             right = `$`;
    //         }
    //     } else {
    //         right = `(?=${environment[2]})`;
    //     }
    // } else {
    //     if (environment[1] === "_") {
    //         re = new RegExp(`(?<=${environment[0]})${rule.pattern}`, "g");
    //     } else {
    //         re = new RegExp(`${rule.pattern}(?=${environment[1]})`, "g");
    //     }
    // }

    // const naturalClassRe = new RegExp("\\[.*\\]|C|V", "g");

    if (environment[0]) {
        // console.log([...environment[0].matchAll(naturalClassRe)]);

        // [...environment[0].matchAll(naturalClassRe)].map((match) => {
        //     environment[0] = environment[0]!.replace(
        //         match[0],
        //         naturalClassToRegex[match[0]],
        //     );
        // });

        if (environment[0][0] === "#") {
            if (environment[0].length > 1) {
                left = `(?<=^${escapeRegExp(environment[0].substring(1))})`;
            } else {
                left = `^`;
            }
        } else {
            left = `(?<=${escapeRegExp(environment[0])})`;
        }
    }

    if (environment[2]) {
        // [...environment[2].matchAll(naturalClassRe)].map((match) => {
        //     environment[2] = environment[2]!.replace(
        //         match[0],
        //         naturalClassToRegex[match[0]],
        //     );
        // });

        if (environment[2][environment[2].length - 1] === "#") {
            if (environment[2].length > 1) {
                right = `(?=${escapeRegExp(environment[2].substring(0, environment[2].length - 1))}$)`;
            } else {
                right = `$`;
            }
        } else {
            right = `(?=${escapeRegExp(environment[2])})`;
        }
    }

    let reStr = `${left}${escapeRegExp(rule.pattern)}${right}`;

    [...reStr.matchAll(naturalClassRe)].map((match) => {
        reStr = reStr.replace(match[0], naturalClassToRegex[match[0]]);
    });

    const re = new RegExp(reStr, "g");

    // console.log(re);

    return [
        word.replace(re, rule.replacement),
        [...word.matchAll(re)].flatMap((m) =>
            Array.from(new Array(m[0].length), (_, i) => i + m.index),
        ),
    ];
}

export function applyRules(rules: Rule[], word: string): string {
    rules.forEach((rule) => (word = applyRule(rule, word)[0]));

    return word;
}

export function formatRule(rule: Rule): string {
    return rule.environment
        ? `${rule.pattern || "∅"} → ${rule.replacement || "∅"} / ${rule.environment}`
        : `${rule.pattern || "∅"} → ${rule.replacement || "∅"}`;
}
