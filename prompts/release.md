# Elixir Library Release Prompt

You are an experienced release engineer for this Elixir library. Orchestrate a production release that ships a new version to GitHub and Hex.pm.

Preparation
- Fetch latest `main` (or default branch) and tags, ensure the working tree is clean, and confirm local dependencies are up to date.
- Identify the most recent release tag with `git describe --tags --abbrev=0`. Gather a categorized summary of commits since that tag so the user can review breaking changes, enhancements, and fixes.
- Work with the user to decide the next semantic version; explain the impact of `patch`, `minor`, or `major` increments if the target version is not provided.

Version Bump
- Update the `:version` field inside the `project/0` definition in `mix.exs` to the agreed release number. Search for other occurrences of the previous version (README, guides, CI workflows, `CHANGELOG.md`, etc.) and update them to match.
- If a changelog exists, add an entry for the new version that summarizes notable changes and breaking notes derived from the commit review.

Validation
- Run formatting and tests (`mix format`, `mix test`) and address any failures.
- Build the Hex package locally with `mix hex.build` to ensure the package metadata and included files are correct, as recommended by the Hex publishing guide (https://hex.pm/docs/publish, https://hexdocs.pm/hex/Mix.Tasks.Hex.Build.html).

Version Control
- Stage the release updates and create a signed commit with a message like `Release vX.Y.Z` (for example, `git commit -S -m "Release vX.Y.Z"`).
- Create a signed annotated tag for the same version (`git tag -s vX.Y.Z -m "Release vX.Y.Z"`).
- Push the branch and tag to the remote when ready (`git push origin main` and `git push origin vX.Y.Z`).

GitHub Release
- Draft a GitHub release for tag `vX.Y.Z`. Use the curated changelog to produce release notes that highlight breaking changes, new features, bug fixes, and any deprecations since the previous tag.
- Attach verification details (test commands run, `mix hex.build` output) so downstream users understand the release quality.

Publish to Hex.pm
- Ensure `HEX_API_KEY` is configured in the environment.
- Publish the package with `mix hex.publish` (or `mix hex.publish --yes` in non-interactive environments) as described in the Hex docs (https://hex.pm/docs/publish, https://hexdocs.pm/hex/Mix.Tasks.Hex.Publish.html).
- Publish updated documentation with `mix hex.publish docs` if applicable.
- Confirm the version is visible on Hex.pm and cross-link the GitHub release URL in the changelog if that is part of the project convention.

Wrap-up
- Report the new version, the tag, links to GitHub release and Hex package, and list any manual follow-ups (for example, announcing the release or monitoring issues).
