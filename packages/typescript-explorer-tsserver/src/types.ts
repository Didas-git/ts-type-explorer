import { TypeInfo } from "@ts-expand-type/api"
import type * as ts from "typescript"

export type ExpandedQuickInfo = ts.QuickInfo & {
    __displayString?: string,
    __displayType?: string,
    __displayTree?: TypeInfo,
}