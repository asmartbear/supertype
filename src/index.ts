
/** Transform that just passes through, when we don't actually want one. */
function NOOP_TRANSFORM<T>(x: T): typeof x {
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

    addPath(segment: string | number | symbol | undefined | null) {
        this.path.push(String(segment));
        this.message = this.fullMessage
    }

    get fullMessage(): string {
        const pathStr = this.path.length
            ? `At key [${this.path.reverse().join('.')}]: `
            : '';
        return pathStr + this.myMessage;
    }
}

/**
 * Implements a parser for a native type, converting `unknown` into the desired native type,
 * or throwing `ValidationError` if it fails.
 */
interface INativeParser<T> {

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
    input(x: unknown, strict?: boolean): T
}

/**
 * A type capable of parsing, validating, conversion, marshalling, and more.
 * Represents a specific Typescript type on input and output.
 */
export abstract class SmartType<INPUT, T> implements INativeParser<T> {

    /**
     * Creates a transformation on top of an input type.
     * 
     * @param description describes it for output
     * @param transform function that performs the transformation, throwing `ValidationException` if it violates a validation
     */
    constructor(
        private readonly origin: INativeParser<INPUT>,
        public readonly description: string,
        private readonly transform: (x: INPUT) => T,
    ) {
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
            if (e instanceof ValidationError) return e
            throw e
        }
    }
}

class SmartNumberBuilder<INPUT> extends SmartType<INPUT, number> {

    /** Validate that the number is at least as large as this, inclusive. */
    min(min: number) {
        return new SmartNumberBuilder(this,
            `min=${min}`,
            (x) => { if (x < min || Number.isNaN(x)) throw new ValidationError(this, x); return x }
        )
    }

    /** Validate that the number is at not larger than this, inclusive. */
    max(max: number) {
        return new SmartNumberBuilder(this,
            `max=${max}`,
            (x) => { if (x > max || Number.isNaN(x)) throw new ValidationError(this, x); return x }
        )
    }

    /** If the input is less or greater than some limit, set it to that limit.  Or `undefined` to ignore that limit. */
    clamp(min: number | undefined, max: number | undefined) {
        return new SmartNumberBuilder(this,
            "clamped",
            (x) => {
                if (min !== undefined && x < min) x = min
                if (max !== undefined && x > max) x = max
                return x
            }
        )
    }
}

/** Converts a native type to a number. */
class NativeNumber implements INativeParser<number> {
    public readonly description = "number"

    input(x: unknown, strict: boolean = true): number {
        if (typeof x === "number") return x
        if (!strict) {
            if (typeof x === "boolean") {
                return x ? 1 : 0
            }
            if (typeof x === "string") {
                const y = parseFloat(x)
                if (!Number.isNaN(y)) return y
            }
        }
        throw new ValidationError(this, x)
    }

    static SINGLETON = new NativeNumber()
}

/** Simple number */
export function NUM() {
    return new SmartNumberBuilder(NativeNumber.SINGLETON, NativeNumber.SINGLETON.description, NOOP_TRANSFORM)
}

class SmartStringBuilder<INPUT> extends SmartType<INPUT, string> {

    /** Validate that the string is at least this many characters. */
    minLen(min: number) {
        return new SmartStringBuilder(this,
            `minLen=${min}`,
            (s) => { if (s.length < min) throw new ValidationError(this, s); return s }
        )
    }
}

/** Inputs anything into a number. */
class NativeString implements INativeParser<string> {
    public readonly description = "string"

    input(x: unknown, strict: boolean = true): string {
        if (typeof x === "string") return x
        if (!strict) {
            if (typeof x === "boolean" || typeof x === "number") return String(x)
        }
        throw new ValidationError(this, x)
    }

    static SINGLETON = new NativeString()
}

/** Generic string */
export function STR() {
    return new SmartStringBuilder(NativeString.SINGLETON, NativeString.SINGLETON.description, NOOP_TRANSFORM)
}



