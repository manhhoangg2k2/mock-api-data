import { z } from "zod";
export declare const fieldChaosSchema: z.ZodObject<{
    omitPercent: z.ZodOptional<z.ZodNumber>;
    nullPercent: z.ZodOptional<z.ZodNumber>;
    edgePercent: z.ZodOptional<z.ZodNumber>;
    edgePreset: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    omitPercent?: number | undefined;
    nullPercent?: number | undefined;
    edgePercent?: number | undefined;
    edgePreset?: string | undefined;
}, {
    omitPercent?: number | undefined;
    nullPercent?: number | undefined;
    edgePercent?: number | undefined;
    edgePreset?: string | undefined;
}>;
export declare const fieldDefSchema: z.ZodObject<{
    key: z.ZodString;
    type: z.ZodEnum<["string", "number", "boolean", "array", "object"]>;
    faker: z.ZodOptional<z.ZodString>;
    chaos: z.ZodOptional<z.ZodObject<{
        omitPercent: z.ZodOptional<z.ZodNumber>;
        nullPercent: z.ZodOptional<z.ZodNumber>;
        edgePercent: z.ZodOptional<z.ZodNumber>;
        edgePreset: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        omitPercent?: number | undefined;
        nullPercent?: number | undefined;
        edgePercent?: number | undefined;
        edgePreset?: string | undefined;
    }, {
        omitPercent?: number | undefined;
        nullPercent?: number | undefined;
        edgePercent?: number | undefined;
        edgePreset?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "string" | "number" | "boolean" | "object" | "array";
    key: string;
    faker?: string | undefined;
    chaos?: {
        omitPercent?: number | undefined;
        nullPercent?: number | undefined;
        edgePercent?: number | undefined;
        edgePreset?: string | undefined;
    } | undefined;
}, {
    type: "string" | "number" | "boolean" | "object" | "array";
    key: string;
    faker?: string | undefined;
    chaos?: {
        omitPercent?: number | undefined;
        nullPercent?: number | undefined;
        edgePercent?: number | undefined;
        edgePreset?: string | undefined;
    } | undefined;
}>;
export declare const virtualPaginationSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    totalCount: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    totalCount?: number | undefined;
}, {
    enabled: boolean;
    totalCount?: number | undefined;
}>;
export declare const schemaConfigSchema: z.ZodObject<{
    responseShape: z.ZodDefault<z.ZodEnum<["object", "array"]>>;
    fields: z.ZodDefault<z.ZodArray<z.ZodObject<{
        key: z.ZodString;
        type: z.ZodEnum<["string", "number", "boolean", "array", "object"]>;
        faker: z.ZodOptional<z.ZodString>;
        chaos: z.ZodOptional<z.ZodObject<{
            omitPercent: z.ZodOptional<z.ZodNumber>;
            nullPercent: z.ZodOptional<z.ZodNumber>;
            edgePercent: z.ZodOptional<z.ZodNumber>;
            edgePreset: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            omitPercent?: number | undefined;
            nullPercent?: number | undefined;
            edgePercent?: number | undefined;
            edgePreset?: string | undefined;
        }, {
            omitPercent?: number | undefined;
            nullPercent?: number | undefined;
            edgePercent?: number | undefined;
            edgePreset?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        type: "string" | "number" | "boolean" | "object" | "array";
        key: string;
        faker?: string | undefined;
        chaos?: {
            omitPercent?: number | undefined;
            nullPercent?: number | undefined;
            edgePercent?: number | undefined;
            edgePreset?: string | undefined;
        } | undefined;
    }, {
        type: "string" | "number" | "boolean" | "object" | "array";
        key: string;
        faker?: string | undefined;
        chaos?: {
            omitPercent?: number | undefined;
            nullPercent?: number | undefined;
            edgePercent?: number | undefined;
            edgePreset?: string | undefined;
        } | undefined;
    }>, "many">>;
    virtualPagination: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodBoolean;
        totalCount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        totalCount?: number | undefined;
    }, {
        enabled: boolean;
        totalCount?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    responseShape: "object" | "array";
    fields: {
        type: "string" | "number" | "boolean" | "object" | "array";
        key: string;
        faker?: string | undefined;
        chaos?: {
            omitPercent?: number | undefined;
            nullPercent?: number | undefined;
            edgePercent?: number | undefined;
            edgePreset?: string | undefined;
        } | undefined;
    }[];
    virtualPagination?: {
        enabled: boolean;
        totalCount?: number | undefined;
    } | undefined;
}, {
    responseShape?: "object" | "array" | undefined;
    fields?: {
        type: "string" | "number" | "boolean" | "object" | "array";
        key: string;
        faker?: string | undefined;
        chaos?: {
            omitPercent?: number | undefined;
            nullPercent?: number | undefined;
            edgePercent?: number | undefined;
            edgePreset?: string | undefined;
        } | undefined;
    }[] | undefined;
    virtualPagination?: {
        enabled: boolean;
        totalCount?: number | undefined;
    } | undefined;
}>;
export type FieldChaos = z.infer<typeof fieldChaosSchema>;
export type FieldDef = z.infer<typeof fieldDefSchema>;
export type VirtualPagination = z.infer<typeof virtualPaginationSchema>;
export type SchemaConfig = z.infer<typeof schemaConfigSchema>;
export declare function parseSchemaConfig(raw: unknown): SchemaConfig;
//# sourceMappingURL=schema-config.d.ts.map