/**
 * Shim: NodeNext + tsc không resolve @devmock/shared qua paths ổn định trên mọi OS/CI.
 * Runtime & typecheck trỏ thẳng tới output đã build của workspace.
 */
export * from "../../../../packages/shared/dist/index.js";
