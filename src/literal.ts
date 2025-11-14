import { ValidationError, Primative, SmartType, isPrimative, NativeFor, JsonFor, ValuesOf, JSONTuple, JSONType } from "./common"

class SmartLiteral<T extends Primative> extends SmartType<T, T> {

    constructor(
        public readonly values: readonly T[],
    ) {
        super('(' + values.map(String).join('|') + ')')
    }

    input(x: unknown, strict: boolean = true) {
        if (isPrimative(x)) {
            const i = this.values.indexOf(x as any)
            if (i >= 0) {
                return this.values[i]        // found, and use our constant and consistent object
            }
        }
        throw new ValidationError(this, x)
    }

    toJSON(x: T): T {
        return x
    }

    fromJSON(js: T): T {
        return this.input(js, true)      // check types and normalize
    }
}

/** One of a given specific set of literal, primative values. */
export function LITERAL<T extends Primative>(...values: readonly T[]) {
    return new SmartLiteral(values)
}
