import { ValidationError, SmartType, JSONType, NativeFor, JsonFor } from "./common"
import { UNDEF } from "./undef"

type AlternationJSON<J extends JSONType> = {
    t: string,
    x: J,
}

class SmartAlternation<ST extends SmartType<any>[]> extends SmartType<NativeFor<ST>, AlternationJSON<JsonFor<ST>>> {

    constructor(
        public readonly types: ST,
    ) {
        super('(' + types.map(t => t.description).join('|') + ')')
    }

    // istanbul ignore next
    get constructorArgs() { return [this.types] }

    get canBeUndefined() {
        return !!this.types.find(t => t.canBeUndefined)         // yes if any of the types is undefined
    }

    input(x: unknown, strict: boolean = true): NativeFor<ST> {
        for (const t of this.types) {
            const y = t.inputReturnError(x, strict)
            if (y instanceof ValidationError) continue
            return y
        }
        throw new ValidationError(this, x)
    }

    toJSON(x: NativeFor<ST>): AlternationJSON<JsonFor<ST>> {
        // Find the type that strictly accepts this value, then encode it in JSON
        for (const t of this.types) {
            const y = t.inputReturnError(x, true)
            if (y instanceof ValidationError) continue
            return { t: t.description, x: t.toJSON(x) as any }
        }
        throw new ValidationError(this, x, "expected validated type for JSON")
    }

    fromJSON(js: AlternationJSON<JsonFor<ST>>): NativeFor<ST> {
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

/** 
 * Returns an "OR" of the given type and `undefined`, like an optional field in an object.
 * If the type can already be undefined, returns the original object.
 */
export function OPT<T>(typ: SmartType<T>): SmartType<T | undefined, JSONType> {
    return typ.canBeUndefined ? typ : OR(typ, UNDEF())
}