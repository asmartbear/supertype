import { ValidationError, SmartType, JSONType, NativeFor } from "./common"

class SmartTuple2<
    A extends SmartType<any>,
    B extends SmartType<any>,
> extends SmartType<[NativeFor<A>, NativeFor<B>], JSONType[]> {

    // We carry along the smart type belonging to the array elements.
    constructor(
        public readonly types: [A, B],
    ) {
        super('[' + types.map(t => t.description).join(',') + ']')
    }

    input(x: unknown, strict: boolean) {
        if (!Array.isArray(x)) throw new ValidationError(this, x, "Expected array")
        if (x.length !== this.types.length) throw new ValidationError(this, x, "Tuple of the wrong length")
        return x.map((y, i) => this.types[i].input(y, strict)) as [NativeFor<A>, NativeFor<B>]
    }

    toJSON(x: [NativeFor<A>, NativeFor<B>]): JSONType[] {
        return x.map((y, i) => this.types[i].toJSON(y))
    }

    fromJSON(js: JSONType[]) {
        return js.map((x, i) => this.types[i].fromJSON(x)) as [NativeFor<A>, NativeFor<B>]
    }
}

/** An array of fixed length and types */
export function TUPLE<A extends SmartType<any>, B extends SmartType<any>>(a: A, b: B): SmartTuple2<A, B> {
    return new SmartTuple2([a, b] as const)
}
