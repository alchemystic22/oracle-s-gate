import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { syncAdminFromURL } from "../lib/admin";
import { CosmicBackdrop } from "../components/ritual/Backdrop";
import { AdminOverlay } from "../components/AdminOverlay";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian-deep px-4">
      <div className="max-w-md text-center">
        <p className="text-parchment-dim text-sm tracking-widest uppercase">No such gate.</p>
        <div className="mt-8">
          <Link to="/gates" className="text-gold-aged hover:text-gold text-sm tracking-wider">return to the constellation</Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian-deep px-4">
      <div className="max-w-md text-center">
        <p className="text-parchment text-base">A seam broke. The work continues.</p>
        <div className="mt-8 flex justify-center gap-3">
          <button onClick={() => { router.invalidate(); reset(); }} className="text-gold-aged hover:text-gold text-sm tracking-wider">try again</button>
          <a href="/" className="text-parchment-dim hover:text-parchment text-sm tracking-wider">return to invocation</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "robots", content: "noindex, nofollow" },
      { title: "Alchemystic Oracle's Seven Gates" },
      { name: "description", content: "An initiatory threshold. Not a course. Not a dashboard." },
      { property: "og:title", content: "Alchemystic Oracle's Seven Gates" },
      { property: "og:description", content: "An initiatory threshold. Not a course. Not a dashboard." },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,400&family=Inter:wght@300;400;500&family=VT323&family=Share+Tech+Mono&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => { syncAdminFromURL(); }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <CosmicBackdrop />
      <Outlet />
      <AdminOverlay />
    </QueryClientProvider>
  );
}
