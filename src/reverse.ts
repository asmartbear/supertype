
// /**
//  * Is an object that contains at least one function?
//  */
// type HasFunction<T> = {
//     [K in keyof T]: T[K] extends (...args: any[]) => any ? true : never;
// }[keyof T] extends never ? false : true;

// function isClassObject(obj: any): boolean {
//     if (typeof obj !== 'function') return false;
//     const prototype = Object.getPrototypeOf(obj.prototype);
//     return prototype && typeof prototype.constructor === 'function';
// }

// /**
//  * The validator type that is the result of attempting to reverse-engineer an instantiated value.
//  */
// export type ValidatorOf<T> =
//     T extends Primative ? Validator<T> :
//     T extends Array<never> ? ArrayValidator<any[]> :
//     T extends Array<infer U> ? ArrayValidator<ValidatedType<ValidatorOf<U>>[]> :
//     T extends ClassOf<infer U> ? Validator<U> :
//     T extends HasFunction<T> ? Validator<InstanceOf<ClassOf<T>>> :
//     T extends object ? ObjectValidator<{ [K in keyof T]: ValidatedType<ValidatorOf<T[K]>> }> :
//     Validator<any>;

// /**
//  * Reverse-engineers a validator from an instantiated type.  Is a best-guess only.
//  * 
//  * @param x The instance to reverse-engineer
//  * @param noExtraFields If true, extra fields in objects are an error.  Normally they are ignored.
//  */
// export function validatorFromInstance<T>(x: T, noExtraFields: boolean = false): ValidatorOf<T> {
//     if (typeof x === "undefined") return UNDEF() as any
//     if (typeof x === "boolean") return BOOL() as any
//     if (typeof x === "number") return NUM() as any
//     if (typeof x === "string") return STR() as any
//     if (x === null) return NIL() as any
//     if (isClassObject(x)) {
//         return CLASS(x as any) as any
//     }
//     if (typeof x === "object") {

//         // Arrays
//         if (Array.isArray(x)) {
//             if (x.length === 0) return ARRAY(PASS()) as any
//             return ARRAY(validatorFromInstance(x[0]) as any) as any
//         }

//         // Direct class objects and class-derived objects have a prototype
//         const proto = Object.getPrototypeOf(x)
//         if (proto && proto !== Object.prototype) {
//             return CLASS((x as any).constructor) as any
//         }

//         // Generic objects with properties
//         const properties: { [key: string]: Validator<any> } = {}
//         for (const key in x) {
//             properties[key] = validatorFromInstance(x[key])
//         }
//         return OBJ(properties, { noExtraFields }) as any
//     }
//     return PASS() as any
// }