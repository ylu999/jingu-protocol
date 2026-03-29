"use strict";
// src/index.ts — jingu-protocol public API
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRPP = exports.isHardFailure = exports.RPP_FAILURE_DESCRIPTIONS = void 0;
var rpp_failures_js_1 = require("./rpp/rpp.failures.js");
Object.defineProperty(exports, "RPP_FAILURE_DESCRIPTIONS", { enumerable: true, get: function () { return rpp_failures_js_1.RPP_FAILURE_DESCRIPTIONS; } });
Object.defineProperty(exports, "isHardFailure", { enumerable: true, get: function () { return rpp_failures_js_1.isHardFailure; } });
var rpp_validate_js_1 = require("./rpp/rpp.validate.js");
Object.defineProperty(exports, "validateRPP", { enumerable: true, get: function () { return rpp_validate_js_1.validateRPP; } });
//# sourceMappingURL=index.js.map