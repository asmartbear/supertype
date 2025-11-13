
export type JSONType = null | boolean | string | number | JSONType[] | { [K: string]: JSONType }

/** Transform that just passes through, when we don't actually want one. */
export function NOOP_TRANSFORM<T>(x: T): typeof x {
    return x
}

/**
 * The exception thrown when `input()` goes wrong.  Includes the fundamental problem,
 * and a full path to where the issue lies.
 */
export class ValidationError extends Error {
    private readonly myMessage: string

    constructor(
        type: INativeParser<any>,
        valueEncountered: any,
        expectedPrefix?: string,
        public path: string[] = []
    ) {
        let msg = expectedPrefix ?? "Expected " + type.description
        msg += ` but got [${String(valueEncountered)}]`
        super(msg);
        this.name = 'ValidationError';
        this.myMessage = msg
    }

    // addPath(segment: string | number | symbol | undefined | null) {
    //     this.path.push(String(segment));
    //     this.message = this.fullMessage
    // }

    // get fullMessage(): string {
    //     const pathStr = this.path.length
    //         ? `At key [${this.path.reverse().join('.')}]: `
    //         : '';
    //     return pathStr + this.myMessage;
    // }
}

/**
 * Implements a parser for a native type, converting `unknown` into the desired native type,
 * or throwing `ValidationError` if it fails.
 */
export interface INativeParser<T> {

    /** A human-readable description of the parser or type */
    description: string

    /**
     * Attempts to convert an input value into this smart type, validating against
     * any additional rules, possibly transforming the value, and finally returning
     * the raw value if it passes, or throwing `ValidationError` on error.
     * 
     * @param x the value to validate, process, and ultimately return as a native value.
     * @param strict if `true`, only allow precise inputs, otherwise try to convert similar types into this type.
     * @returns the validated value.
     * @throws {ValidationError} If the input is invalid
     */
    input(x: unknown, strict: boolean): T
}

/**
 * Implements marshalling a native type to and from a JSON-compatible object.
 */
export interface IMarshallJson<T, J extends JSONType> {
    /** Sends the native type to a JSON format */
    toJSON(x: T): J

    /** Converts something from `toJSON()` back into the native type */
    fromJSON(js: J): T
}

/**
 * A type capable of parsing, validating, conversion, marshalling, and more.
 * Represents a specific Typescript type on input and output.
 */
export abstract class SmartType<INPUT = any, T = any, J extends JSONType = JSONType> implements INativeParser<T>, IMarshallJson<T, J> {
    private readonly origin: INativeParser<INPUT>
    public readonly description: string
    private readonly transform: (x: INPUT) => T

    /**
     * Creates a transformation on top of an input type.
     * 
     * @param origin the upstream thing that parses, validates, transforms, etc, that we're chaining onto
     * @param description describes it for output, or `undefined` to inherit from the origin
     * @param transform function that performs the transformation, throwing `ValidationException` if it violates a validation
     */
    constructor(origin: INativeParser<INPUT>, description?: string, transform?: (x: INPUT) => T) {
        this.origin = origin
        this.description = description ?? origin.description
        this.transform = transform ?? (NOOP_TRANSFORM as any)
    }

    input(x: unknown, strict: boolean = true): T {
        return this.transform(this.origin.input(x, strict))
    }

    /**
     * Same as `input()` but returns errors as objects rather than throwing them.
     */
    inputReturnError(x: unknown, strict: boolean): T | ValidationError {
        try {
            return this.input(x, strict)
        } catch (e) {
            // istanbul ignore next
            if (e instanceof ValidationError) return e
            // istanbul ignore next
            throw e
        }
    }

    abstract toJSON(x: T): J;
    abstract fromJSON(js: J): T;
}