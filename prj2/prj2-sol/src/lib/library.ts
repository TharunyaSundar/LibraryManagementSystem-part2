import { Errors } from "cs544-js-utils";
import { zodToResult } from "./zod-utils.js";

import { z } from "zod";

const GUTENBERG_YEAR = 1448;
const NOW_YEAR = new Date().getFullYear();

//specify key in zod validator to get value as message after
//passing through zodToResult()
const MSGS = {
  "msg.isbn": 'isbn must be of the form "ddd-ddd-ddd-d"',
  "msg.nonEmpty": "must be non-empty",
  "msg.oneOrMoreAuthors": "must have one or more authors",
  "msg.publishYear": `must be a past year on or after ${GUTENBERG_YEAR}`,
  "msg.pageMustBeNumber": "pages must be a number",
  "msg.positiveInteger": "must be a positive integer",
};

// use zod to force Book to have the following fields:
//   isbn: a ISBN-10 string of the form ddd-ddd-ddd-d.
//   title: a non-empty string.
//   authors: a non-empty array of non-empty strings.
//   pages: a positive integer.
//   year: an integer within the range [GUTENBERG_YEAR, NOW_YEAR].
//   publisher: a non-empty string.
//   nCopies: an optional positive integer
export const Book = z.object({
  isbn: z.string().regex(/^\d{3}-\d{3}-\d{3}-\d$/, MSGS["msg.isbn"]),
  title: z.string().min(1, MSGS["msg.nonEmpty"]),
  authors: z
    .array(z.string().min(1, MSGS["msg.nonEmpty"]))
    .min(1, MSGS["msg.oneOrMoreAuthors"]),
  pages: z.number().int().positive({ message: MSGS["msg.pageMustBeNumber"] }),
  year: z
    .number()
    .int({ message: "year must be a number" })
    .min(GUTENBERG_YEAR, MSGS["msg.publishYear"])
    .max(NOW_YEAR, MSGS["msg.publishYear"]),
  publisher: z.string().min(1, MSGS["msg.nonEmpty"]),
  nCopies: z.number().int().positive().optional(),
});

export type Book = z.infer<typeof Book>;

const XBook = Book.required();
export type XBook = z.infer<typeof XBook>;

// use zod to force Find to have the following fields:
//   search: a string which contains at least one word of two-or-more \w.
//   index: an optional non-negative integer.
//   count: an optional non-negative integer.
export const Find = z.object({
  search: z
    .string()
    .regex(
      /\w{2,}/,
      "Search must contain at least one word with two or more characters"
    ),
  index: z.number().int().nonnegative().optional(),
  count: z.number().int().nonnegative().optional(),
});
export type Find = z.infer<typeof Find>;

// use zod to force Lend to have the following fields:
//   isbn: a ISBN-10 string of the form ddd-ddd-ddd-d.
//   patronId: a non-empty string.
const Lend = z.object({
  isbn: z.string().regex(/^\d{3}-\d{3}-\d{3}-\d$/, MSGS["msg.isbn"]),
  patronId: z.string().min(1, MSGS["msg.nonEmpty"]),
});
export type Lend = z.infer<typeof Lend>;

const VALIDATORS: Record<string, z.ZodSchema> = {
  addBook: Book,
  findBooks: Find,
  checkoutBook: Lend,
  returnBook: Lend,
};

export function validate<T>(
  command: string,
  req: Record<string, any>
): Errors.Result<T> {
  const validator = VALIDATORS[command];
  return validator
    ? zodToResult(validator.safeParse(req), MSGS)
    : Errors.errResult(`no validator for command ${command}`);
}
