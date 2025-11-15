import { getClassOf, isClassObject, isPlainObject } from '@asmartbear/simplified'
import { ValidationError, ValuesOf, SmartType, JSONType, NativeFor, JsonFor, Primative, isPrimative } from "./common"
import { BOOL } from "./boolean"
import { UNDEF } from "./undef"
import { NUM } from "./number"
import { STR } from "./string"
import { NIL } from "./null"
import { ARRAY } from "./array"
import { CLASS } from "./class"
import { OBJ, FieldOptions } from "./fields"

/** Given a type, returns the Class of that type. */
type ClassOf<T> = (abstract new (...args: any[]) => T) | (new (...args: any[]) => T);

type HasFunction<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? true : never;
}[keyof T] extends never ? false : true;

/** Given a class, returns the instance-type that it creates. */
type InstanceOf<C> = C extends ClassOf<infer T> ? T : never;

/** The smart type corresponding to a given native type */
export type SmartTypeFrom<T> =
    T extends undefined ? ReturnType<typeof UNDEF> :
    T extends null ? ReturnType<typeof NIL> :
    T extends boolean ? ReturnType<typeof BOOL> :
    T extends number ? ReturnType<typeof NUM> :
    T extends string ? ReturnType<typeof STR> :
    T extends ClassOf<infer U> ? SmartType<U> :
    HasFunction<T> extends true ? SmartType<T> :      // catch class-instances before generic structures
    T extends Array<infer U> ? SmartType<NativeFor<SmartTypeFrom<U>>[]> :       // rewrap inner
    T extends { [K in keyof T]: T[K] } ? SmartType<{ [K in keyof T]: NativeFor<SmartTypeFrom<T[K]>> }> :       // rewrap inner
    never;

/**
 * Given an instantiated Javascript object, attempts to reverse-engineer the smart-type that matches it.
 * 
 * @param x the object to match
 * @param options optional options for creating types
 */
export function reverseEngineerType<T>(x: T, options?: FieldOptions): SmartTypeFrom<T> {
    switch (typeof x) {
        case 'undefined': return UNDEF() as any
        case 'boolean': return BOOL() as any
        case 'number': return NUM() as any
        case 'string': return STR() as any

        // Mostly no, but catch classes
        case 'function':
            if (isClassObject(x)) {
                return CLASS(x) as any
            }
            throw new Error(`Unsupported native type for reverse-engineering a data type: ${typeof x}`)

        case 'object':
            // null
            if (x === null) return NIL() as any
            // Arrays
            if (Array.isArray(x)) {
                if (x.length == 0) {
                    throw new Error(`Arrays cannot be empty for reverse-engineering`)
                }
                return ARRAY(reverseEngineerType(x[0], options)) as any
            }
            // Direct class-derived objects are simply validated that they are that type of object
            const derivedClass = getClassOf(x)
            if (derivedClass) {
                return CLASS(derivedClass) as any
            }
            // Remaining objects are treated as generic fields
            return OBJ(Object.fromEntries(
                Object.entries(x).map(
                    ([k, v]) => [k, reverseEngineerType(v, options)]
                )
            ), options) as any
        default:
            throw new Error(`Unsupported native type for reverse-engineering a data type: ${typeof x}`)
    }
}
