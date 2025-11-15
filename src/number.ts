import { ValidationError, SmartType, transformer, JSONType } from "./common"

/** The native `number` type */
class SmartNumber extends SmartType<number, number | "Inf" | "-Inf" | "NaN"> {

    constructor() {
        super("number")
    }

    input(x: unknown, strict: boolean = true): number {
        if (typeof x === "number") return x
        if (!strict) {
            if (typeof x === "boolean") {
                return x ? 1 : 0
            }
            if (typeof x === "string") {
                const y = parseFloat(x)     // try the native way
                if (!Number.isNaN(y) && x.match(/^[0-9\.-]+$/)) {       // double-check it's not like "12foo"
                    return y
                }
            }
        }
        throw new ValidationError(this, x)
    }

    toJSON(x: number): number | "Inf" | "-Inf" | "NaN" {
        if (typeof x === "number") {
            if (Number.isNaN(x)) return "NaN"
            if (x === Number.POSITIVE_INFINITY) return "Inf"
            if (x === Number.NEGATIVE_INFINITY) return "-Inf"
            return x
        }
        throw new ValidationError(this, x)
    }

    fromJSON(x: JSONType): number {
        switch (x) {
            case 'Inf': return Number.POSITIVE_INFINITY
            case '-Inf': return Number.NEGATIVE_INFINITY
            case 'NaN': return Number.NaN
        }
        if (typeof x !== "number") throw new ValidationError(this, x, "Expected number")
        return x
    }

    /** Validate that the number is at least as large as this, inclusive. */
    min(min: number) {
        return transformer<number, this>(this,
            `min=${min}`,
            (x) => { if (x < min || Number.isNaN(x)) throw new ValidationError(this, x, "Beyond minimum"); return x }
        )
    }

    /** Validate that the number is at not larger than this, inclusive. */
    max(max: number) {
        return transformer<number, this>(this,
            `max=${max}`,
            (x) => { if (x > max || Number.isNaN(x)) throw new ValidationError(this, x, "Beyond maximum"); return x }
        )
    }

    /** If the input is less or greater than some limit, set it to that limit.  Or `undefined` to ignore that limit. */
    clamp(min: number | undefined, max: number | undefined) {
        return transformer<number, this>(this,
            "clamped",
            (x) => {
                if (min !== undefined && x < min) x = min
                if (max !== undefined && x > max) x = max
                return x
            }
        )
    }

    /** Enforce the number is a (safe) integer value. */
    int() {
        return transformer<number, this>(this,
            `int`,
            (x) => { if (!Number.isSafeInteger(x)) throw new ValidationError(this, x, "Not an integer"); return x }
        )
    }
}

/** Simple number */
export function NUM() {
    return new SmartNumber()
}
