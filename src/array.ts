import { ValidationError, transformer, SmartType, JSONType } from "./common"

class SmartArray<T> extends SmartType<T[], JSONType[]> {

    // We carry along the smart type belonging to the array elements.
    constructor(
        public readonly elementType: SmartType<T>,
    ) {
        super(elementType.description + '[]')
    }

    get constructorArgs(): ConstructorParameters<typeof SmartArray<T>> { return [this.elementType] }

    input(x: unknown, strict: boolean): T[] {
        if (!Array.isArray(x)) throw new ValidationError(this, x, "Expected array")
        return x.map(el => this.elementType.input(el, strict))
    }

    toJSON(x: T[]): JSONType[] {
        return x.map(el => this.elementType.toJSON(el))
    }

    fromJSON(x: JSONType[]): T[] {
        return x.map(el => this.elementType.fromJSON(el))
    }

    /** Validate that the array has at least this elements. */
    minLen(min: number) {
        return transformer<T[], this>(this,
            `minLen=${min}`,
            (a) => {
                if (a.length < min) throw new ValidationError(this, a);
                return a
            }
        )
    }
}

/** Generic string */
export function ARRAY<T>(elementType: SmartType<T>) {
    return new SmartArray(elementType)
}
