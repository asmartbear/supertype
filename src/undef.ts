import { ValidationError, SmartType } from "./common"

export const JS_UNDEFINED_SIGNAL = "__undefined__"

class SmartUndefined extends SmartType<undefined, typeof JS_UNDEFINED_SIGNAL> {

    constructor() {
        super("undefined")
    }

    get canBeUndefined() { return true }

    input(x: unknown, strict: boolean = true): undefined {
        if (typeof x === "undefined") return x
        throw new ValidationError(this, x)
    }

    toJSON(x: any): typeof JS_UNDEFINED_SIGNAL {
        return JS_UNDEFINED_SIGNAL
    }

    fromJSON(x: any) {
        return undefined
    }
}

/** The `undefined` value */
export function UNDEF() {
    return new SmartUndefined()
}
