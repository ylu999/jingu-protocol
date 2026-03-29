import { RPPFailureCode } from "./rpp.types.js";
export type RPPFailureDescription = {
    severity: "error" | "warning";
    description: string;
    example: string;
};
export declare const RPP_FAILURE_DESCRIPTIONS: Record<RPPFailureCode, RPPFailureDescription>;
export declare function isHardFailure(code: RPPFailureCode): boolean;
//# sourceMappingURL=rpp.failures.d.ts.map