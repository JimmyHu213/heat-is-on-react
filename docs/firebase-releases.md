# Dashboard releases

| GitHub environment | Firebase Auth, Firestore and Hosting project | Trigger |
| --- | --- | --- |
| staging | heat-is-on | Push to main after checks pass |
| production | the-heat-is-on | Actions → Firebase release → Run workflow → main |

## One-time setup

An IAM administrator for each Firebase project runs the following from a checkout of this revision in Google Cloud Shell. The script creates a dedicated Google service account, workload identity pool and GitHub provider in the selected project. Each provider trusts the repository's numeric owner and repository IDs, main branch, release workflow, event and environment. Authentication uses short-lived credentials.

```sh
bash scripts/setup-release-identity.sh heat-is-on
bash scripts/setup-release-identity.sh the-heat-is-on
```

In GitHub Settings → Environments, use staging and production with main as the deployment branch. If the training link is configured, set the TRAINING_COURSE_URL environment variable to its course URL. The workflow reads the Firebase web configuration from the target site's reserved Hosting endpoint and checks the project ID before building.

## Promote

1. Merge the feature into main. The push runs tests and publishes Firestore rules and Hosting to staging. The run verifies the revision, login page and entry script served by Hosting.
2. Exercise the change at https://heat-is-on.web.app using staging accounts. For a production release, dispatch Firebase release on main. The workflow checks that the current main commit passed the staging push and matches the release served there.
3. Verify the original account, active games and completed history at https://the-heat-is-on.web.app. Playing a move here writes a production save.

The two projects have separate users and game data. Indexes are managed separately. The first cutover uses the existing production indexes verified with the dashboard queries. When a later change needs another index, create it in the target and wait for READY before releasing code that depends on it.

## Recover a release

The production job records the previous Hosting version and Firestore ruleset in its run summary before changing either. Rules deploy first. If Hosting fails afterward, inspect both entries. In Firebase Hosting's release history, roll back to the recorded version. To restore the rules, get the recorded ruleset's source from the Firebase Rules API and publish that source from Firestore → Rules. Verify old-account access, then fix forward on main. Hosting rollback only changes the website. Game data written after release stays in its project.
