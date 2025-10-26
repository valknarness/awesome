# GitHub Actions Workflows

This document describes the automated workflows for building and managing the Awesome database.

## Overview

Two workflows automate database management:

1. **Build Database** - Creates a fresh database daily
2. **Cleanup Artifacts** - Removes old artifacts to save storage

## Build Database Workflow

**File:** `.github/workflows/build-database.yml`

### Schedule

- **Automatic:** Daily at 02:00 UTC
- **Manual:** Can be triggered via GitHub Actions UI or CLI

### Features

#### Automatic Daily Builds
- Fetches [sindresorhus/awesome](https://github.com/sindresorhus/awesome)
- Recursively indexes all awesome lists
- Collects GitHub metadata (stars, forks, last commit)
- Generates full-text search index
- Compresses and uploads as artifact

#### Build Modes

**Full Mode** (default):
- Indexes all awesome lists
- Takes ~2-3 hours
- Produces comprehensive database

**Sample Mode**:
- Indexes random sample of 10 lists
- Takes ~5-10 minutes
- Good for testing

#### GitHub Token Integration
- Uses `GITHUB_TOKEN` secret for API access
- Provides 5,000 requests/hour (vs 60 without auth)
- Automatically configured during build

### Manual Triggering

#### Via GitHub CLI

```bash
# Trigger full build
gh workflow run build-database.yml -f index_mode=full

# Trigger sample build (for testing)
gh workflow run build-database.yml -f index_mode=sample

# Check workflow status
gh run list --workflow=build-database.yml

# View specific run
gh run view <run-id>
```

#### Via GitHub UI

1. Go to repository → Actions tab
2. Select "Build Awesome Database" workflow
3. Click "Run workflow" button
4. Choose index mode (full/sample)
5. Click "Run workflow"

### Outputs

#### Artifacts Uploaded

- `awesome-{timestamp}.db` - Timestamped database file
- `awesome-latest.db` - Always points to newest build
- `metadata.json` - Build information

**Artifact Naming:** `awesome-database-{run_id}`

**Retention:** 90 days

#### Metadata Structure

```json
{
  "build_date": "2025-10-26 02:15:43 UTC",
  "build_timestamp": 1730000143,
  "git_sha": "abc123...",
  "workflow_run_id": "12345678",
  "total_lists": 450,
  "total_repos": 15000,
  "total_readmes": 12500,
  "size_mb": 156.42,
  "node_version": "v22.0.0",
  "index_mode": "full"
}
```

#### Build Summary

Each run generates a summary with:
- Statistics (lists, repos, READMEs, size)
- Build timing information
- Download instructions
- Direct artifact link

### Monitoring

#### Check Recent Runs

```bash
# List last 10 runs
gh run list --workflow=build-database.yml --limit 10

# Show only failed runs
gh run list --workflow=build-database.yml --status failure

# Watch current run
gh run watch
```

#### View Build Logs

```bash
# Show logs for specific run
gh run view <run-id> --log

# Show only failed steps
gh run view <run-id> --log-failed
```

## Cleanup Artifacts Workflow

**File:** `.github/workflows/cleanup-artifacts.yml`

### Schedule

- **Automatic:** Daily at 03:00 UTC (after database build)
- **Manual:** Can be triggered with custom settings

### Features

#### Automatic Cleanup
- Removes artifacts older than 30 days (default)
- Cleans up old workflow runs (>30 days, keeping last 50)
- Generates detailed cleanup report
- Dry-run mode available

#### Configurable Retention
- Default: 30 days
- Can be customized per run
- Artifacts within retention period are preserved

### Manual Triggering

#### Via GitHub CLI

```bash
# Standard cleanup (30 days)
gh workflow run cleanup-artifacts.yml

# Custom retention period (60 days)
gh workflow run cleanup-artifacts.yml -f retention_days=60

# Dry run (preview only, no deletions)
gh workflow run cleanup-artifacts.yml -f dry_run=true -f retention_days=30

# Aggressive cleanup (7 days)
gh workflow run cleanup-artifacts.yml -f retention_days=7
```

#### Via GitHub UI

1. Go to repository → Actions tab
2. Select "Cleanup Old Artifacts" workflow
3. Click "Run workflow" button
4. Configure options:
   - **retention_days**: Days to keep (default: 30)
   - **dry_run**: Preview mode (default: false)
5. Click "Run workflow"

### Cleanup Report

Each run generates a detailed report showing:

#### Summary Statistics
- Total artifacts scanned
- Number deleted
- Number kept
- Storage space freed (MB)

#### Deleted Artifacts Table
- Artifact name
- Size
- Creation date
- Age (in days)

#### Kept Artifacts Table
- Recently created artifacts
- Artifacts within retention period
- Limited to first 10 for brevity

### Storage Management

#### Checking Storage Usage

```bash
# List all artifacts with sizes
gh api repos/:owner/:repo/actions/artifacts \
  | jq -r '.artifacts[] | "\(.name) - \(.size_in_bytes / 1024 / 1024 | floor)MB - \(.created_at)"'

# Calculate total storage
gh api repos/:owner/:repo/actions/artifacts \
  | jq '[.artifacts[].size_in_bytes] | add / 1024 / 1024 | floor'
```

#### Retention Strategy

**Recommended settings:**
- **Production:** 30-60 days retention
- **Development:** 14-30 days retention
- **Testing:** 7-14 days retention

**Storage limits:**
- Free GitHub: Limited artifact storage
- GitHub Pro: More generous limits
- GitHub Team/Enterprise: Higher limits

## Downloading Databases

### Method 1: Interactive Script (Recommended)

```bash
./scripts/download-db.sh
```

**Features:**
- Lists all available builds
- Shows metadata (date, size, commit)
- Interactive selection
- Automatic backup of existing database
- Progress indication

**Usage:**
```bash
# Interactive mode
./scripts/download-db.sh

# Specify repository
./scripts/download-db.sh --repo owner/awesome

# Download latest automatically
./scripts/download-db.sh --repo owner/awesome --latest
```

### Method 2: GitHub CLI Direct

```bash
# List available artifacts
gh api repos/OWNER/REPO/actions/artifacts | jq -r '.artifacts[].name'

# Download specific run
gh run download <run-id> -n awesome-database-<run-id>

# Extract and install
mkdir -p ~/.awesome
cp awesome-*.db ~/.awesome/awesome.db
```

### Method 3: GitHub API

```bash
# Get latest successful run
RUN_ID=$(gh api repos/OWNER/REPO/actions/workflows/build-database.yml/runs \
  | jq -r '.workflow_runs[0].id')

# Download artifact
gh run download $RUN_ID -n awesome-database-$RUN_ID
```

## Troubleshooting

### Build Failures

**Problem:** Workflow fails during indexing

**Solutions:**
1. Check API rate limits
2. Review build logs: `gh run view <run-id> --log-failed`
3. Try sample mode for testing
4. Check GitHub status page

**Common Issues:**
- GitHub API rate limiting
- Network timeouts
- Invalid awesome list URLs

### Download Issues

**Problem:** Cannot download artifacts

**Solutions:**
1. Ensure GitHub CLI is authenticated: `gh auth status`
2. Check artifact exists: `gh run list --workflow=build-database.yml`
3. Verify artifact hasn't expired (90 days)
4. Try alternative download method

### Storage Issues

**Problem:** Running out of artifact storage

**Solutions:**
1. Reduce retention period: `gh workflow run cleanup-artifacts.yml -f retention_days=14`
2. Run manual cleanup: `gh workflow run cleanup-artifacts.yml`
3. Check current usage with GitHub API
4. Consider upgrading GitHub plan

### Permission Issues

**Problem:** Workflow lacks permissions

**Solutions:**
1. Verify `GITHUB_TOKEN` has required scopes
2. Check workflow permissions in `.yml` file
3. Review repository settings → Actions → General

## Best Practices

### For Maintainers

1. **Monitor Build Success Rate**
   - Set up notifications for failed builds
   - Review logs regularly
   - Keep dependencies updated

2. **Optimize Build Times**
   - Use sample mode for development
   - Cache dependencies when possible
   - Monitor for slow API responses

3. **Manage Storage**
   - Run cleanups regularly
   - Adjust retention based on usage
   - Archive important builds

4. **Documentation**
   - Keep artifact metadata updated
   - Document any custom configurations
   - Update README with changes

### For Users

1. **Download Strategy**
   - Use latest builds for current data
   - Check metadata before downloading
   - Keep local backup of preferred versions

2. **Update Frequency**
   - Daily builds provide fresh data
   - Weekly downloads usually sufficient
   - On-demand for specific needs

3. **Storage Management**
   - Clean old local databases
   - Use compression for backups
   - Verify database integrity after download

## Advanced Usage

### Custom Build Scripts

You can create custom workflows based on the provided templates:

```yaml
# Example: Weekly comprehensive build
name: Weekly Full Index
on:
  schedule:
    - cron: '0 0 * * 0'  # Sundays at midnight
  workflow_dispatch:

jobs:
  build:
    uses: ./.github/workflows/build-database.yml
    with:
      index_mode: full
```

### Notification Integration

Add notifications to workflow:

```yaml
- name: Notify on completion
  if: always()
  run: |
    # Send to Slack, Discord, email, etc.
    curl -X POST $WEBHOOK_URL -d "Build completed: ${{ job.status }}"
```

### Multi-Platform Builds

Extend workflow for different platforms:

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest, windows-latest]
    node-version: [22, 20, 18]
```

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub CLI Manual](https://cli.github.com/manual/)
- [Artifact Storage Limits](https://docs.github.com/en/billing/managing-billing-for-github-actions/about-billing-for-github-actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)

## Support

For issues or questions:
1. Check this documentation
2. Review workflow logs
3. Open an issue in the repository
4. Consult GitHub Actions documentation
