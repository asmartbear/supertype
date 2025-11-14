import { ValidationError, SmartType } from "./common"

/** The native `boolean` type */
class SmartBoolean extends SmartType<boolean, boolean> {

    constructor() {
        super("boolean")
    }

    input(x: unknown, strict: boolean = true): boolean {
        if (typeof x === "boolean") return x
        if (!strict) {
            if (!x) return false
            if (typeof x === "object") {
                if (Array.isArray(x)) return x.length > 0
                return Object.keys(x).length > 0
            }
            return true
        }
        throw new ValidationError(this, x)
    }

    toJSON(x: boolean) {
        return x
    }

    fromJSON(x: boolean) {
        return x
    }
}

/** Simple boolean */
export function BOOL() {
    return new SmartBoolean()
}
