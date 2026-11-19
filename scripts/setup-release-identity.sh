#!/usr/bin/env bash
# One-time project administrator setup. Run in Google Cloud Shell.
set -euo pipefail
project=${1:?Usage: bash scripts/setup-release-identity.sh PROJECT_ID}
case "$project" in
  heat-is-on) environment=staging; event=push ;;
  the-heat-is-on) environment=production; event=workflow_dispatch ;;
  *) echo "Unknown Firebase project" >&2; exit 2 ;;
esac

repo=JimmyHu213/heat-is-on-react
repo_id=957445783
owner_id=83951876
pool=dashboard-releases
account="dashboard-release@$project.iam.gserviceaccount.com"
subject="repo:$repo:environment:$environment"
condition="assertion.repository_id=='$repo_id' && assertion.repository_owner_id=='$owner_id' && assertion.ref=='refs/heads/main' && assertion.workflow_ref=='$repo/.github/workflows/firebase.yml@refs/heads/main' && assertion.event_name=='$event' && assertion.sub=='$subject'"
number=$(gcloud projects describe "$project" --format='value(projectNumber)')
gcloud services enable iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com cloudresourcemanager.googleapis.com --project="$project"

if ! gcloud iam service-accounts describe "$account" --project="$project" >/dev/null 2>&1; then
  gcloud iam service-accounts create dashboard-release --display-name="Dashboard GitHub release" --project="$project"
fi
if ! gcloud iam workload-identity-pools describe "$pool" --location=global --project="$project" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools create "$pool" --location=global --display-name="Dashboard releases" --project="$project"
fi
provider_args=(github --workload-identity-pool="$pool" --location=global --project="$project")
if gcloud iam workload-identity-pools providers describe "${provider_args[@]}" >/dev/null 2>&1; then
  actual=$(gcloud iam workload-identity-pools providers describe "${provider_args[@]}" --format='value(attributeCondition)')
  issuer=$(gcloud iam workload-identity-pools providers describe "${provider_args[@]}" --format='value(oidc.issuerUri)')
  mapping=$(gcloud iam workload-identity-pools providers describe "${provider_args[@]}" --format=json | python3 -c 'import json,sys; print(json.load(sys.stdin)["attributeMapping"]["google.subject"])')
  if [[ "$actual" != "$condition" || "$issuer" != "https://token.actions.githubusercontent.com" || "$mapping" != "assertion.sub" ]]; then
    echo "Existing GitHub provider differs. Review its trust configuration before continuing." >&2
    exit 1
  fi
else
  gcloud iam workload-identity-pools providers create-oidc "${provider_args[@]}" \
    --issuer-uri=https://token.actions.githubusercontent.com --attribute-mapping=google.subject=assertion.sub \
    --attribute-condition="$condition"
fi
other_providers=$(gcloud iam workload-identity-pools providers list --workload-identity-pool="$pool" --location=global --project="$project" --format='value(name.basename())')
[[ "$other_providers" == github ]] || { echo "Expected a dedicated pool containing only the github provider" >&2; exit 1; }

gcloud iam service-accounts add-iam-policy-binding "$account" --project="$project" \
  --role=roles/iam.workloadIdentityUser \
  --member="principal://iam.googleapis.com/projects/$number/locations/global/workloadIdentityPools/$pool/subject/$subject" --condition=None >/dev/null

# The pinned Firebase CLI checks index permissions for the Firestore deploy target.
for role in firebasehosting.admin firebaserules.admin datastore.indexAdmin serviceusage.serviceUsageConsumer; do
  gcloud projects add-iam-policy-binding "$project" --member="serviceAccount:$account" --role="roles/$role" --condition=None >/dev/null
done
echo "Configured $environment deployment for $project."
