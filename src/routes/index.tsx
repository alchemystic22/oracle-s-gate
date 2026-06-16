import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Alchemystic Oracle's 7 Gates" },
      { name: "description", content: "Alchemystic Oracle's 7 Gates — initializing." },
      { property: "og:title", content: "Alchemystic Oracle's 7 Gates" },
      { property: "og:description", content: "Alchemystic Oracle's 7 Gates — initializing." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: "#0a0a0b", color: "#e8e6df" }}
    >
      <h1 className="text-xl tracking-wide">
        Alchemystic Oracle's 7 Gates — initializing.
      </h1>
    </main>
  );
}
