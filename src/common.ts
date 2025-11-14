import { Simple, simplifiedToDisplay, simplifiedToHash, simplify, simplifyOpaqueType } from "@asmartbear/simplified";

export type Primative = boolean | number | string | null
export type JSONType = null | boolean | string | number | JSONType[] | { [K: string]: JSONType } | { [K: number]: JSONType }
export type JSONTuple = { [K: number]: JSONType }
export type JSONObject = { [K: string]: JSONType }

/**
 * The values of object or array `T`
 */
export type ValuesOf<T> = T[keyof T];

/**
 * Given a type, returns the Class of that type.
 */
export type ClassOf<T> = (new (...args: any[]) => T);

/**
 * Given a class, returns the instance-type that it creates.
 */
export type InstanceOf<C> = C extends new (...args: any[]) => infer T ? T : never;

type ConcreteConstructor<T = {}> = new (...args: any[]) => T;

/**
 * The exception thrown when `input()` goes wrong.  Includes the fundamental problem,
 * and a full path to where the issue lies.
 */
export class ValidationError extends Error {
    private readonly myMessage: string

    constructor(
        type: IDescriptive,
        valueEncountered: any,
        expectedPrefix?: string,
        public path: string[] = []
    ) {
        let msg = expectedPrefix ?? "Expected " + type.description
        msg += ` but got: ${simplifiedToDisplay(simplify(valueEncountered))}`
        super(msg);
        this.name = 'ValidationError';
        this.myMessage = msg
    }

    // addPath(segment: string | number | symbol | undefined | null) {
    //     this.path.push(String(segment));
    //     this.message = this.fullMessage
    // }

    // get fullMessage(): string {
    //     const pathStr = this.path.length
    //         ? `At key [${this.path.reverse().join('.')}]: `
    //         : '';
    //     return pathStr + this.myMessage;
    // }
}

export interface IDescriptive {

    /** A human-readable description of whatever this is */
    description: string
}

/**
 * Implements a parser for a native type, converting `unknown` into the desired native type `T`,
 * or throwing `ValidationError` if it fails.
 */
export interface INativeParser<T> extends IDescriptive {

    /**
     * Attempts to convert an input value into this smart type, validating against
     * any additional rules, possibly transforming the value, and finally returning
     * the raw value if it passes, or throwing `ValidationError` on error.
     * 
     * @param x the value to validate, process, and ultimately return as a native value.
     * @param strict if `true`, only allow precise inputs, otherwise try to convert similar types into this type.
     * @returns the validated value.
     * @throws {ValidationError} If the input is invalid
     */
    input(x: unknown, strict: boolean): T
}

/**
 * Implements marshalling a native type to and from a JSON-compatible object.
 */
export interface IMarshallJson<T, J extends JSONType> {
    /** Sends the native type to a JSON format */
    toJSON(x: T): J

    /** Converts something from `toJSON()` back into the native type */
    fromJSON(js: J): T
}

/** Symbol used for the configured default value for the type, if any. */
export const __DEFAULT_VALUE = Symbol('__DEFAULT_VALUE')

/**
 * A type capable of parsing, validating, conversion, marshalling, and more.
 * Represents a specific Typescript type on input and output.
 */
export abstract class SmartType<T = any, J extends JSONType = JSONType> implements INativeParser<T>, IMarshallJson<T, J> {

    /** If not `undefined`, a default value to use in things like structured fields, if it is missing. */
    [__DEFAULT_VALUE]: T | undefined = undefined

    constructor(public description: string) { }

    /**
     * Same as `input()` but returns errors as objects rather than throwing them.
     */
    inputReturnError(x: unknown, strict: boolean): T | ValidationError {
        try {
            return this.input(x, strict)
        } catch (e) {
            // istanbul ignore next
            if (e instanceof ValidationError) return e
            // istanbul ignore next
            throw e
        }
    }

    /** Sets the default value to use if this type isn't represent in a parent object or other structure. */
    def(x: T): this {
        this[__DEFAULT_VALUE] = x
        this.description += '=' + simplifiedToDisplay(this.toSimplified(x))
        return this
    }

    /** Gets the simplified version of this data (a la `@asmartbear/simplified`) */
    toSimplified(x: T): Simple {
        return simplifyOpaqueType(x)        // don't need a type system for this per se, but could potentially tweak this based on configuration
    }

    /** Gets a hash value for the object, normalized for things like field-ordering and ignoring undefined fields */
    toHash(x: T): string {
        return simplifiedToHash(this.toSimplified(x))
    }

    get constructorArgs(): any[] { return [this.description] }

    abstract input(x: unknown, strict?: boolean): T;
    abstract toJSON(x: T): J;
    abstract fromJSON(js: J): T;
}

/**
 * Extends a `SmartType` base class with a new class that executes a transformation of some upstream type
 * in its `input()`, returning something that is of the identical type to the base-class but with this
 * transformation applied.
 * 
 * @param Base base-class to extend
 * @param upstream upstream type for processing input before we apply this transformation
 * @param description human-readable description to use for this transformation
 * @param fTransform transformation function
 * @returns the same type as was passed in for `Base`, but applies the changes.
 */
export function transformer<T, TYPE extends SmartType<T>>(
    upstream: TYPE,
    description: string,
    fTransform: (x: T) => T
): typeof upstream {
    const UpstreamClass = upstream.constructor as ConcreteConstructor<ClassOf<typeof upstream>>;
    const cls = class extends UpstreamClass {
        // Wrap the description
        public readonly description = `${upstream.description}>>${description}`
        // Wrap input in the transformation
        input(x: unknown, strict: boolean = true): T {
            return fTransform(upstream.input(x, strict))
        }
        // Carry state forward
        [__DEFAULT_VALUE] = upstream[__DEFAULT_VALUE]
    }
    return new cls(...upstream.constructorArgs) as any
}

/**
 * Extracts the native type out of a SmartType, or the union of native types if an array or other amalgamation.
 */
export type NativeFor<ST> =
    ST extends SmartType<infer T, any> ? T
    : ST extends SmartType[] ? NativeFor<ValuesOf<ST>>
    : ST extends { readonly [K: string]: SmartType } ? { [K in keyof ST]: NativeFor<ST[K]>; }
    : never;

/**
 * Extracts the JSON out of a SmartType, or the union of JSON types if an array or other amalgamation.
 */
export type JsonFor<ST> =
    ST extends SmartType<any, infer J> ? J
    : ST extends SmartType[] ? JsonFor<ValuesOf<ST>>
    : ST extends { readonly [K: string]: SmartType } ? { [K in keyof ST]: JsonFor<ST[K]>; }
    : never;


/** From a tuple of SmartType, gives a tuple of the native types */
export type NativeTupleFor<ST extends readonly SmartType[]> = {
    [K in keyof ST]: NativeFor<ST[K]>;
};

/** From a tuple of SmartType, gives a tuple of the JSON types */
export type JsonTupleFor<ST extends readonly SmartType[]> = {
    [K in keyof ST]: JsonFor<ST[K]>;
};

/**
 * True if the argument is a `Primative`, and tells Typescript.
 */
export function isPrimative(x: unknown): x is Primative {
    switch (typeof x) {
        case 'boolean':
        case 'number':
        case 'string':
            return true
        case 'object':
            return x === null
    }
    return false
}