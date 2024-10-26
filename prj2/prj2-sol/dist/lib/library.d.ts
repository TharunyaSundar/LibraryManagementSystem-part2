import { Errors } from "cs544-js-utils";
import { z } from "zod";
export declare const Book: z.ZodObject<{
    isbn: z.ZodString;
    title: z.ZodString;
    authors: z.ZodArray<z.ZodString, "many">;
    pages: z.ZodNumber;
    year: z.ZodNumber;
    publisher: z.ZodString;
    nCopies: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    year?: number;
    isbn?: string;
    title?: string;
    authors?: string[];
    pages?: number;
    publisher?: string;
    nCopies?: number;
}, {
    year?: number;
    isbn?: string;
    title?: string;
    authors?: string[];
    pages?: number;
    publisher?: string;
    nCopies?: number;
}>;
export type Book = z.infer<typeof Book>;
declare const XBook: z.ZodObject<{
    isbn: z.ZodString;
    title: z.ZodString;
    authors: z.ZodArray<z.ZodString, "many">;
    pages: z.ZodNumber;
    year: z.ZodNumber;
    publisher: z.ZodString;
    nCopies: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    year?: number;
    isbn?: string;
    title?: string;
    authors?: string[];
    pages?: number;
    publisher?: string;
    nCopies?: number;
}, {
    year?: number;
    isbn?: string;
    title?: string;
    authors?: string[];
    pages?: number;
    publisher?: string;
    nCopies?: number;
}>;
export type XBook = z.infer<typeof XBook>;
export declare const Find: z.ZodObject<{
    search: z.ZodString;
    index: z.ZodOptional<z.ZodNumber>;
    count: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    search?: string;
    index?: number;
    count?: number;
}, {
    search?: string;
    index?: number;
    count?: number;
}>;
export type Find = z.infer<typeof Find>;
declare const Lend: z.ZodObject<{
    isbn: z.ZodString;
    patronId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    isbn?: string;
    patronId?: string;
}, {
    isbn?: string;
    patronId?: string;
}>;
export type Lend = z.infer<typeof Lend>;
export declare function validate<T>(command: string, req: Record<string, any>): Errors.Result<T>;
export {};
//# sourceMappingURL=library.d.ts.map