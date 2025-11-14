import { ValidationError, Primative, SmartType, isPrimative, NativeFor, JsonFor, ValuesOf, JSONTuple, JSONType } from "./common"

class SmartLiteral<LIST extends readonly Primative[], T = ValuesOf<LIST>> extends SmartType<T, T & JSONType> {

    constructor(
        public readonly values: readonly T[],
    ) {
        super('(' + values.map(String).join('|') + ')')
    }

    input(x: unknown, strict: boolean = true) {
        if (isPrimative(x)) {
            const y = this.values.find(x as any)
            if (y !== undefined) {
                return y        // found, and use our constant and consistent object
            }
        }
        throw new ValidationError(this, x)
    }

    toJSON(x: T): T & JSONType {
        return x as any     // we know primatives are all JSON types
    }

    fromJSON(js: T & JSONType): T {
        return this.input(js, true)      // check types and normalize
    }
}

/** One of a specific set of literal primative values. */
export function LITERAL<LIST extends readonly Primative[]>(...values: LIST): SmartLiteral<LIST> {
    return new SmartLiteral(values as any)
}
