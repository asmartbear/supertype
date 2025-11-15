import { ValidationError, SmartType, JSONType, NativeFor, __DEFAULT_VALUE, JsonFor } from "./common"

class SmartFields<ST extends { readonly [K: string]: SmartType<any> }> extends SmartType<NativeFor<ST>, JsonFor<ST>> {

    // We carry along the smart type belonging to the field elements.
    constructor(
        public readonly types: ST,
    ) {
        super('{' + Object.entries(types).map(([k, t]) => `${k}:${t.description}`).join(',') + '}')
    }

    // istanbul ignore next
    get constructorArgs() { return [this.types] }

    input(x: unknown, strict: boolean = true) {
        if (typeof x !== "object") throw new ValidationError(this, x, "Expected object")
        if (!x) throw new ValidationError(this, x, "Got null instead of object")
        const ent: [string, any][] = []
        for (const [k, t] of Object.entries(this.types)) {
            // Load this field
            const y = (x as any)[k]
            // Field missing?
            if (y === undefined) {
                // If it's optional anyway, we're fine
                if (!t.canBeUndefined) {
                    // If there's a default value, it's time to use it
                    if (t[__DEFAULT_VALUE] !== undefined) {
                        ent.push([k, t[__DEFAULT_VALUE]])
                    }
                    // No recourse; you're missing a required, non-default field.
                    else {
                        throw new ValidationError(this, x, `Missing required field [${k}]`)
                    }
                }
            }
            // Field was present; convert it.
            else {
                ent.push([k, t.input(y, strict)])
            }
        }
        //  throw new ValidationError(this, x, `Found spurious field [${k}]`)
        return Object.fromEntries(ent) as NativeFor<ST>
    }

    toJSON(x: NativeFor<ST>): JsonFor<ST> {
        return Object.fromEntries(
            Object.entries(x).map(
                ([k, y]) => [k, this.types[k].toJSON(y)]
            )
        ) as JsonFor<ST>
    }

    fromJSON(js: JsonFor<ST>) {
        return Object.fromEntries(
            Object.entries(js).map(
                ([k, y]) => [k, this.types[k].fromJSON(y)]
            )
        ) as NativeFor<ST>
    }
}

/** An array of fixed length and types */
export function OBJ<ST extends { readonly [K: string]: SmartType<any> }>(types: ST): SmartFields<ST> {
    return new SmartFields(types)
}
