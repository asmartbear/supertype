import { ValidationError, INativeParser, SmartType, JSONType } from "./common"

class SmartArray<INPUT, T> extends SmartType<INPUT, T[], JSONType[]> {

    toJSON(x: T[]): JSONType[] {
        return []
    }

    fromJSON(x: JSONType[]): T[] {
        return []
    }

    /** Validate that the array has at least this elements. */
    minLen(min: number) {
        return new SmartArray(this,
            `minLen=${min}`,
            (a) => {
                if (a.length < min) throw new ValidationError(this, a);
                return a
            }
        )
    }
}

/** Inputs various array-like things into an array, recursively resolving things inside that array. */
class NativeArray<T> implements INativeParser<T[]> {

    constructor(public readonly elementType: SmartType<T>) { }

    get description(): string {
        return this.elementType.description + '[]'
    }

    input(x: unknown, strict: boolean): T[] {
        if (!Array.isArray(x)) throw new ValidationError(this, x, "Expected array")
        return x.map(el => this.elementType.input(el, strict))
    }
}

/** Generic string */
export function ARRAY<T>(elementType: SmartType<T>) {
    return new SmartArray<any, T>(new NativeArray(elementType))
}



