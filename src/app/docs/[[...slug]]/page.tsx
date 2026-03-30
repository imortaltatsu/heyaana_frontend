import { notFound } from "next/navigation";
import path from "path";
import fs from "fs";
import { compileMDX } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/docs/MdxComponents";
import { DocsBreadcrumb } from "@/components/docs/DocsBreadcrumb";
import { DocsPagination } from "@/components/docs/DocsPagination";
import { flattenNav } from "@/lib/docs-nav";

const CONTENT_DIR = path.join(process.cwd(), "content", "docs");

function resolveSlug(slugParts: string[] | undefined): string {
  if (!slugParts || slugParts.length === 0) return "welcome";
  return slugParts.join("/");
}

function getMdxPath(slug: string): string | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  if (fs.existsSync(filePath)) return filePath;
  return null;
}

export function generateStaticParams() {
  const flat = flattenNav();
  const params = [
    { slug: [] }, // /docs -> welcome
    ...flat.map((link) => ({ slug: link.slug.split("/") })),
  ];
  return params;
}

export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug: slugParts } = await params;
  const slug = resolveSlug(slugParts);
  const filePath = getMdxPath(slug);

  if (!filePath) {
    notFound();
  }

  const source = fs.readFileSync(filePath, "utf-8");

  const { content } = await compileMDX({
    source,
    components: mdxComponents,
    options: { parseFrontmatter: true },
  });

  return (
    <article>
      <DocsBreadcrumb slug={slug} />
      <div className="docs-content">{content}</div>
      <DocsPagination slug={slug} />
    </article>
  );
}
