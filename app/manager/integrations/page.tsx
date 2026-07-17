import { TrelloIntegration } from "@/components/admin/trello-integration"
import { GitHubIntegration } from "@/components/admin/github-integration"

export default function IntegrationsPage() {
  return (
    <div className="mx-auto max-w-3xl pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-100">Integrations</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Connect your Trello and GitHub accounts and choose which boards / organizations to
          track. Employee activity is matched to employees by their Trello / GitHub username.
        </p>
      </div>

      <div className="space-y-6">
        <TrelloIntegration />
        <GitHubIntegration />
      </div>
    </div>
  )
}
