"use client";

import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-6xl font-dmsans font-bold mb-4">404</h1>
                    <h2 className="text-2xl font-dmsans font-semibold mb-2">Page not found</h2>
                    <p className="text-muted-foreground font-inter">
                        Sorry — we couldn't find the page you were looking for.
                    </p>
                </div>

                <div className="space-y-4">
                    <Button
                        className="w-full font-figtree"
                        onClick={() => (window.location.href = "/")}
                    >
                        Go to Login Page
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full font-figtree"
                        onClick={() => (window.location.href = "/builder")}
                    >
                        Schedule Builder
                    </Button>
                </div>
            </div>
        </div>
    );
}
