import { ValidationError, INativeParser, SmartType, JSONType, NativeFor, ValuesOf } from "./common"

type AlternationJSON = {
    t: string,
    x: JSONType,
}

class SmartAlternation<ST extends SmartType<any>[]> extends SmartType<NativeFor<ST>, AlternationJSON> {

    constructor(
        public readonly types: ST,
    ) {
        super('(' + types.map(t => t.description).join('|') + ')')
    }

    input(x: unknown, strict: boolean): NativeFor<ST> {
        for (const t of this.types) {
            const y = t.inputReturnError(x, strict)
            if (y instanceof ValidationError) continue
            return y
        }
        throw new ValidationError(this, x)
    }

    toJSON(x: NativeFor<ST>): AlternationJSON {
        // Find the type that strictly accepts this value, then encode it in JSON
        for (const t of this.types) {
            const y = t.inputReturnError(x, true)
            if (y instanceof ValidationError) continue
            return { t: t.description, x: t.toJSON(x) }
        }
        throw new ValidationError(this, x, "expected validated type for JSON")
    }

    fromJSON(js: AlternationJSON): NativeFor<ST> {
        // Pick off the type and value, then unwrap recursively
        for (const t of this.types) {
            if (t.description === js.t) {
                return t.fromJSON(js.x)
            }
        }
        throw new ValidationError(this, js, "expected alternation type for JSON")
    }
}

/** Any of these types are acceptable. */
export function OR<ST extends SmartType<any>[]>(...types: ST) {
    return new SmartAlternation(types)
}
