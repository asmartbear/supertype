
/**
 * The exception thrown when `input()` goes wrong.  Includes the fundamental problem,
 * and a full path to where the issue lies.
 */
export class ValidationError extends Error {
    private readonly myMessage: string

    constructor(
        type: SmartType<any>,
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
 * A type capable of parsing, validating, conversion, marshalling, and more.
 * Represents a specific Typescript type on input and output.
 */
export abstract class SmartType<T> {

    /** Returns a structured, human-readable description of the type */
    abstract get description(): string;

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
    abstract input(x: unknown, strict?: boolean): T

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

abstract class SmartNumberBuilder extends SmartType<number> {

    /** Validate that the number is at least as large as this, inclusive. */
    min(min: number) {
        return new SmartNumberTransformer(this,
            `min=${min}`,
            (x) => { if (x < min || Number.isNaN(x)) throw new ValidationError(this, x); return x }
        )
    }

    /** Validate that the number is at not larger than this, inclusive. */
    max(max: number) {
        return new SmartNumberTransformer(this,
            `max=${max}`,
            (x) => { if (x > max || Number.isNaN(x)) throw new ValidationError(this, x); return x }
        )
    }

    /** If the input is less or greater than some limit, set it to that limit.  Or `undefined` to ignore that limit. */
    clamp(min: number | undefined, max: number | undefined) {
        return new SmartNumberTransformer(this,
            "clamped",
            (x) => {
                if (min !== undefined && x < min) x = min
                if (max !== undefined && x > max) x = max
                return x
            }
        )
    }
}

/** Inputs anything into a number. */
class SmartNumber extends SmartNumberBuilder {
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
}

class SmartNumberTransformer extends SmartNumberBuilder {
    /**
     * Creates a transformation on top of an input type.
     * 
     * @param origin the type we're transforming from
     * @param description describes it for output
     * @param fTransform function that performs the transformation, throwing `ValidationException` if it violates a validation
     */
    constructor(
        private readonly origin: SmartType<number>,
        public readonly description: string,
        private readonly transform: (x: number) => number,
    ) {
        super()
    }

    input(x: unknown, strict: boolean = true): number {
        return this.transform(this.origin.input(x, strict))
    }
}

/** Generic number */
export function NUM() {
    return new SmartNumber()
}


abstract class SmartStringBuilder extends SmartType<string> {

    /** Validate that the string is at least this many characters. */
    minLen(min: number) {
        return new SmartStringTransformer(this,
            `minLen=${min}`,
            (s) => { if (s.length < min) throw new ValidationError(this, s); return s }
        )
    }
}

/** Inputs anything into a number. */
class SmartString extends SmartStringBuilder {
    public readonly description = "string"

    input(x: unknown, strict: boolean = true): string {
        if (typeof x === "string") return x
        if (!strict) {
            if (typeof x === "boolean" || typeof x === "number") return String(x)
        }
        throw new ValidationError(this, x)
    }
}

class SmartStringTransformer extends SmartStringBuilder {
    constructor(
        private readonly origin: SmartType<string>,
        public readonly description: string,
        private readonly transform: (x: string) => string,
    ) {
        super()
    }

    input(x: unknown, strict: boolean = true): string {
        return this.transform(this.origin.input(x, strict))
    }
}

/** Generic string */
export function STR() {
    return new SmartString()
}



