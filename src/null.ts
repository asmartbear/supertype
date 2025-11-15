import { ValidationError, SmartType } from "./common"

class SmartNull extends SmartType<null, null> {

    constructor() {
        super("null")
    }

    input(x: unknown, strict: boolean = true): null {
        if (x === null) return null
        throw new ValidationError(this, x)
    }

    toJSON(x: any): null {
        if (x === null) return x
        throw new ValidationError(this, x)
    }

    fromJSON(x: any) {
        if (x === null) return x
        throw new ValidationError(this, x)
    }
}

/** The `null` value */
export function NIL() {
    return new SmartNull()
}
