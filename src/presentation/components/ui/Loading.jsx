import React from "react";
import { Spinner } from "./spinner";
import { cn } from "@/presentation/lib/utils";

export function Loading({ message = "Loading...", fullScreen = false, size = "md", className = "" }) {
    const spinnerCls = size === "sm" ? "w-4 h-4" : "w-5 h-5";
    const textCls = size === "sm" ? "text-sm" : "text-lg";

    if (fullScreen) {
        return (
            <div className={cn("flex items-center justify-center h-screen", className)}>
                <div className="flex items-center gap-3 text-gray-500">
                    <Spinner className={spinnerCls} />
                    <div className={textCls}>{message}</div>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("flex items-center gap-2 text-gray-500", className)}>
            <Spinner className={spinnerCls} />
            {message && <span className={textCls}>{message}</span>}
        </div>
    );
}

export default Loading;
