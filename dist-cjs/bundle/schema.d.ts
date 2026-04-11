export interface BundleIdentity {
    namespace: string;
    name: string;
    version: string;
}
export interface PrincipalSpec {
    name: string;
    required: boolean;
    fakeCheckEligible: boolean;
    rolloutStage: string;
}
export interface ContractSchema {
    phase: string;
    subtype: string;
    requiredPrincipals: string[];
    expectedPrincipals: string[];
}
export interface BundleSchema {
    identity: BundleIdentity;
    version: string;
    schema_version: string;
    compiler_version: string;
    generated_at: string;
    generator_commit?: string;
    phases: Record<string, unknown>;
    contracts: ContractSchema[];
    principals: PrincipalSpec[];
}
//# sourceMappingURL=schema.d.ts.map