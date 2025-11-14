import { ValidationError, SmartType, JSONType, NativeObjectFor, __DEFAULT_VALUE } from "./common"

class SmartFields<ST extends { readonly [K: string]: SmartType<any> }> extends SmartType<NativeObjectFor<ST>, { readonly [K: string]: JSONType }> {

    // We carry along the smart type belonging to the field elements.
    constructor(
        public readonly types: ST,
    ) {
        super('{' + Object.entries(types).map(([k, t]) => `${k}:${t.description}`).join(',') + '}')
    }

    input(x: unknown, strict: boolean = true) {
        if (typeof x !== "object") throw new ValidationError(this, x, "Expected object")
        if (!x) throw new ValidationError(this, x, "Got null instead of object")
        const ent: [string, any][] = []
        for (const [k, t] of Object.entries(this.types)) {
            const y = (x as any)[k]
            if (y === undefined) {
                if (t[__DEFAULT_VALUE] !== undefined) {
                    ent.push([k, t[__DEFAULT_VALUE]])
                } else {
                    throw new ValidationError(this, x, `Missing required field [${k}]`)
                }
            } else {
                ent.push([k, t.input(y, strict)])
            }
        }
        //  throw new ValidationError(this, x, `Found spurious field [${k}]`)
        return Object.fromEntries(ent) as NativeObjectFor<ST>
    }

    toJSON(x: NativeObjectFor<ST>): { readonly [K: string]: JSONType } {
        return Object.fromEntries(
            Object.entries(x).map(
                ([k, y]) => [k, this.types[k].toJSON(y)]
            )
        )
    }

    fromJSON(js: { readonly [K: string]: JSONType }) {
        return Object.fromEntries(
            Object.entries(js).map(
                ([k, y]) => [k, this.types[k].fromJSON(y)]
            )
        ) as NativeObjectFor<ST>
    }
}

/** An array of fixed length and types */
export function OBJ<ST extends { readonly [K: string]: SmartType<any> }>(types: ST): SmartFields<ST> {
    return new SmartFields(types)
}
