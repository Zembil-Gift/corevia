import { TrelloIntegration } from "@/components/admin/trello-integration"
import { GitHubIntegration } from "@/components/admin/github-integration"

export default function IntegrationsPage() {
  return (
    <div className="mx-auto max-w-3xl pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-100">Integrations</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Connect Trello and GitHub, choose which boards / organizations to track, and tick the
          sub-organizations each one covers. Activity is matched to employees by their Trello / GitHub username.
        </p>
      </div>

      <div className="space-y-6">
        {/* Google (Calendar + Sheets) hidden until it works; restore <GoogleIntegration />. */}
        <TrelloIntegration />
        <GitHubIntegration />
      </div>
    </div>
  )
}
