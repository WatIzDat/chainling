"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "./ui/button";
import {
    Popover,
    PopoverContent,
    PopoverHeader,
    PopoverTrigger,
} from "./ui/popover";
import Form from "next/form";
import { Field, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { MouseEventHandler, useState } from "react";

export default function RulePopover({
    children,
    customTrigger,
    onSubmit,
}: {
    children?: React.ReactElement;
    customTrigger?: (
        onClick: MouseEventHandler<HTMLButtonElement>,
    ) => React.ReactElement;
    onSubmit: (
        pattern: string,
        replacement: string,
        environmentBefore: string,
        environmentAfter: string,
    ) => any;
}) {
    const [open, setOpen] = useState(false);

    const newCustomTrigger =
        customTrigger &&
        customTrigger(() => {
            console.log("clicked");
            setOpen((open) => !open);
        });

    return (
        <Popover
            open={customTrigger ? open : undefined}
            onOpenChange={customTrigger ? setOpen : undefined}
        >
            {/* {children && ( */}
            <PopoverTrigger asChild>
                {newCustomTrigger ? newCustomTrigger : children}
            </PopoverTrigger>
            {/* )} */}
            <PopoverContent side="left">
                <PopoverHeader>add rule</PopoverHeader>
                <Form
                    action={(e) => {
                        console.log(e);

                        onSubmit(
                            e.get("pattern")?.toString()!,
                            e.get("replacement")?.toString()!,
                            e.get("environmentBefore")?.toString()!,
                            e.get("environmentAfter")?.toString()!,
                        );
                    }}
                >
                    <FieldGroup className="gap-4">
                        <Field orientation="horizontal">
                            <FieldLabel htmlFor="pattern" className="w-1/2">
                                pattern
                            </FieldLabel>
                            <Input id="pattern" name="pattern" />
                        </Field>
                        <Field orientation="horizontal">
                            <FieldLabel htmlFor="replacement" className="w-1/2">
                                replacement
                            </FieldLabel>
                            <Input id="replacement" name="replacement" />
                        </Field>
                        <Field orientation="horizontal">
                            <FieldLabel id="environment" className="w-1/2">
                                environment
                            </FieldLabel>
                            <Input
                                id="environmentBefore"
                                name="environmentBefore"
                                aria-labelledby="environment"
                            />
                            _
                            <Input
                                id="environmentAfter"
                                name="environmentAfter"
                                aria-labelledby="environment"
                            />
                        </Field>
                        <Field>
                            <Button type="submit">add</Button>
                        </Field>
                    </FieldGroup>
                </Form>
            </PopoverContent>
        </Popover>
    );
}
