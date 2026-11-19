# Firebase release plan

1. Verify the workshop branch with lint, unit tests, an emulator build, and Auth and Firestore emulator integration tests on pull requests and releases.
2. Configure one GitHub OIDC provider and deployment service account per project. Bind each to the repository ID, main branch, workflow, event and GitHub environment.
3. Publish main to heat-is-on. Verify the served application against the build. Promote the same tested main commit manually to the-heat-is-on using its own client configuration.
4. Record the previous production Hosting version and ruleset before publishing. Check existing-account login, game lists and saved progress after the first cutover.

Verify that a PR cannot publish, mismatched client configuration fails the build, an untested or superseded commit cannot promote, and each environment keeps its own Auth and Firestore data.
