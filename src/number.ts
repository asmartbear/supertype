import { ValidationError, INativeParser, SmartType } from "./common"

class SmartNumber<INPUT> extends SmartType<INPUT, number, number> {

    toJSON(x: number): number {
        return x
    }

    fromJSON(x: number): number {
        return x
    }

    /** Validate that the number is at least as large as this, inclusive. */
    min(min: number) {
        return new SmartNumber(this,
            `min=${min}`,
            (x) => { if (x < min || Number.isNaN(x)) throw new ValidationError(this, x); return x }
        )
    }

    /** Validate that the number is at not larger than this, inclusive. */
    max(max: number) {
        return new SmartNumber(this,
            `max=${max}`,
            (x) => { if (x > max || Number.isNaN(x)) throw new ValidationError(this, x); return x }
        )
    }

    /** If the input is less or greater than some limit, set it to that limit.  Or `undefined` to ignore that limit. */
    clamp(min: number | undefined, max: number | undefined) {
        return new SmartNumber(this,
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

    input(x: unknown, strict: boolean): number {
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

    static SINGLETON = new NativeNumber()
}

/** Simple number */
export function NUM() {
    return new SmartNumber(NativeNumber.SINGLETON)
}
