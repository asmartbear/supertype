import { ValidationError, SmartType, JSONType, NativeTupleFor } from "./common"

class SmartTuple<ST extends readonly SmartType<any>[]> extends SmartType<NativeTupleFor<ST>, JSONType[]> {

    // We carry along the smart type belonging to the array elements.
    constructor(
        public readonly types: ST,
    ) {
        super('[' + types.map(t => t.description).join(',') + ']')
    }

    input(x: unknown, strict: boolean): NativeTupleFor<ST> {
        if (!Array.isArray(x)) throw new ValidationError(this, x, "Expected array")
        if (x.length !== this.types.length) throw new ValidationError(this, x, "Tuple of the wrong length")
        return x.map((y, i) => this.types[i].input(y, strict)) as NativeTupleFor<ST>
    }

    toJSON(x: NativeTupleFor<ST>): JSONType[] {
        return (x as any[]).map((y, i) => this.types[i].toJSON(y))
    }

    fromJSON(js: JSONType[]) {
        return js.map((x, i) => this.types[i].fromJSON(x)) as NativeTupleFor<ST>
    }
}

/** An array of fixed length and types */
export function TUPLE<ST extends readonly SmartType<any>[]>(...types: ST): SmartTuple<ST> {
    return new SmartTuple(types)
}
