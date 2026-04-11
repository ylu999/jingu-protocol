"use strict";
// src/bundle/validate.ts — Runtime validation for BundleSchema
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBundleSchema = validateBundleSchema;
function validateBundleSchema(bundle) {
    const errors = [];
    if (!bundle || typeof bundle !== "object") {
        return { valid: false, errors: ["bundle must be an object"] };
    }
    const b = bundle;
    if (!b.identity)
        errors.push("missing required field: identity");
    if (!b.version)
        errors.push("missing required field: version");
    if (!b.schema_version)
        errors.push("missing required field: schema_version");
    if (!b.phases)
        errors.push("missing required field: phases");
    if (!Array.isArray(b.contracts))
        errors.push("contracts must be an array");
    return { valid: errors.length === 0, errors };
}
//# sourceMappingURL=validate.js.map