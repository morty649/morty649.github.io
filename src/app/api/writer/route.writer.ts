import {
  deployStatus,
  getDeployLinks,
  listPosts,
  loadPost,
  markDraft,
  postFiles,
  publishPost,
  pushChanges,
  removePost,
  renderPreview,
  saveImage,
  savePost,
  type EditablePost,
} from "@/lib/writer";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// The writer can write files and push to GitHub, so only this machine may call it:
// the Host check stops DNS rebinding, and the custom header forces a CORS preflight
// that other websites open in the same browser cannot pass.
function rejectForeign(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) {
    return "The writer only accepts requests from this machine.";
  }
  if (request.method === "POST" && request.headers.get("x-writer") !== "1") {
    return "Missing writer header.";
  }
  return null;
}

async function handle(request: NextRequest, run: (action: string, params: URLSearchParams) => Promise<unknown>) {
  const rejection = rejectForeign(request);
  if (rejection) {
    return NextResponse.json({ error: rejection }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  try {
    return NextResponse.json(await run(params.get("action") ?? "", params));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}

// The file change is on disk before git runs, so report git failures without losing that fact.
async function reportPush(push: () => Promise<{ sha: string | null; commits: string[] }>) {
  try {
    return { saved: true, ...(await push()) };
  } catch (error) {
    return { saved: true, sha: null, commits: [], publishError: error instanceof Error ? error.message : String(error) };
  }
}

export function GET(request: NextRequest) {
  return handle(request, async (action, params) => {
    switch (action) {
      case "list":
        return { posts: listPosts(), ...(await getDeployLinks()) };
      case "load":
        return { post: loadPost(params.get("slug") ?? "") };
      case "status":
        return deployStatus(params.get("sha") ?? "");
      default:
        throw new Error(`Unknown action "${action}".`);
    }
  });
}

export function POST(request: NextRequest) {
  return handle(request, async (action, params) => {
    switch (action) {
      case "preview": {
        const { body } = (await request.json()) as { body: string };
        return { html: await renderPreview(body) };
      }
      case "save": {
        const { post, isNew, publish } = (await request.json()) as {
          post: EditablePost;
          isNew: boolean;
          publish: boolean;
        };
        savePost(publish ? { ...post, draft: false } : post, isNew);
        return publish ? reportPush(() => publishPost(post.slug)) : { saved: true, sha: null, commits: [] };
      }
      case "unpublish": {
        const { slug } = (await request.json()) as { slug: string };
        const title = markDraft(slug);
        return reportPush(() => pushChanges(postFiles(slug), `Blog: unpublish ${title}`));
      }
      case "delete": {
        const { slug } = (await request.json()) as { slug: string };
        const files = postFiles(slug);
        const title = removePost(slug);
        return reportPush(() => pushChanges(files, `Blog: delete ${title}`));
      }
      case "upload": {
        const data = Buffer.from(await request.arrayBuffer());
        return { url: saveImage(params.get("slug") ?? "", params.get("name") ?? "image.png", data) };
      }
      default:
        throw new Error(`Unknown action "${action}".`);
    }
  });
}
