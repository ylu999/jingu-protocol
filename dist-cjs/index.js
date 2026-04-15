"use strict";
// src/index.ts — jingu-protocol public API
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertVerdict = exports.ALL_VERDICTS = exports.assertSubtype = exports.ALL_SUBTYPES = exports.assertPrincipal = exports.ALL_PRINCIPALS = exports.assertPhase = exports.ALL_PHASES = exports.formatBundleIdentity = exports.parseBundleIdentity = exports.validateBundleSchema = exports.validateRPP = exports.isHardFailure = exports.RPP_FAILURE_DESCRIPTIONS = void 0;
var rpp_failures_js_1 = require("./rpp/rpp.failures.js");
Object.defineProperty(exports, "RPP_FAILURE_DESCRIPTIONS", { enumerable: true, get: function () { return rpp_failures_js_1.RPP_FAILURE_DESCRIPTIONS; } });
Object.defineProperty(exports, "isHardFailure", { enumerable: true, get: function () { return rpp_failures_js_1.isHardFailure; } });
var rpp_validate_js_1 = require("./rpp/rpp.validate.js");
Object.defineProperty(exports, "validateRPP", { enumerable: true, get: function () { return rpp_validate_js_1.validateRPP; } });
var index_js_1 = require("./bundle/index.js");
Object.defineProperty(exports, "validateBundleSchema", { enumerable: true, get: function () { return index_js_1.validateBundleSchema; } });
var index_js_2 = require("./bundle/index.js");
Object.defineProperty(exports, "parseBundleIdentity", { enumerable: true, get: function () { return index_js_2.parseBundleIdentity; } });
Object.defineProperty(exports, "formatBundleIdentity", { enumerable: true, get: function () { return index_js_2.formatBundleIdentity; } });
var index_js_3 = require("./symbols/index.js");
Object.defineProperty(exports, "ALL_PHASES", { enumerable: true, get: function () { return index_js_3.ALL_PHASES; } });
Object.defineProperty(exports, "assertPhase", { enumerable: true, get: function () { return index_js_3.assertPhase; } });
Object.defineProperty(exports, "ALL_PRINCIPALS", { enumerable: true, get: function () { return index_js_3.ALL_PRINCIPALS; } });
Object.defineProperty(exports, "assertPrincipal", { enumerable: true, get: function () { return index_js_3.assertPrincipal; } });
Object.defineProperty(exports, "ALL_SUBTYPES", { enumerable: true, get: function () { return index_js_3.ALL_SUBTYPES; } });
Object.defineProperty(exports, "assertSubtype", { enumerable: true, get: function () { return index_js_3.assertSubtype; } });
Object.defineProperty(exports, "ALL_VERDICTS", { enumerable: true, get: function () { return index_js_3.ALL_VERDICTS; } });
Object.defineProperty(exports, "assertVerdict", { enumerable: true, get: function () { return index_js_3.assertVerdict; } });
//# sourceMappingURL=index.js.map