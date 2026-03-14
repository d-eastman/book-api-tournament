# CLAUDE.md

This file provides persistent project context for AI-assisted
development.

Only include instructions relevant to most development tasks.

------------------------------------------------------------------------

# Project Context

## About This Project

PROJECT_DESCRIPTION_PLACEHOLDER

Example: "A REST API for managing travel insurance products and
policies."

------------------------------------------------------------------------

# Tech Stack

Primary technologies used in this project:

-   Language: LANGUAGE_PLACEHOLDER
-   Framework: FRAMEWORK_PLACEHOLDER
-   Database: DATABASE_PLACEHOLDER
-   Infrastructure: INFRASTRUCTURE_PLACEHOLDER

Other notable dependencies:

-   LIBRARY_PLACEHOLDER
-   LIBRARY_PLACEHOLDER

------------------------------------------------------------------------

# Architecture

ARCHITECTURE_PATTERN_PLACEHOLDER

Example:

-   Microservices architecture
-   Layered architecture
-   Hexagonal architecture
-   Monolith

------------------------------------------------------------------------

# Key Directories

-   `src/` --- Application source code
-   `tests/` --- Test suite
-   `scripts/` --- Utility scripts
-   `docs/` --- Project documentation

Add additional directories as needed.

------------------------------------------------------------------------

# Development Commands

Replace with the commands used in your project.

    DEV_COMMAND_PLACEHOLDER
    TEST_COMMAND_PLACEHOLDER
    BUILD_COMMAND_PLACEHOLDER
    LINT_COMMAND_PLACEHOLDER

Example:

    npm install
    npm run dev
    npm run test
    npm run build

------------------------------------------------------------------------

# Standards

Include only rules that cause bugs if ignored.

Examples:

-   All APIs must return JSON responses.
-   All endpoints must include OpenAPI documentation.
-   Environment configuration must come from environment variables.
-   Never commit secrets or credentials.

------------------------------------------------------------------------

# Conditional Rules

When working in specific directories:

## src/api

-   API endpoints must validate input using schemas.
-   Return appropriate HTTP status codes.
-   Update API documentation when endpoints change.

## tests

-   Test structure should mirror source structure.
-   Mock external services.
-   Avoid calling real third‑party APIs.

## scripts

-   Scripts must be idempotent when possible.
-   Include a `--dry-run` option for destructive operations.

------------------------------------------------------------------------

# Workflows

## Adding a New API Endpoint

1.  Check for existing endpoint patterns.
2.  Define request/response schema.
3.  Implement endpoint.
4.  Add tests.
5.  Update API documentation.
6.  Run full test suite.

## Database Changes

1.  Describe schema change.
2.  Generate migration.
3.  Review migration.
4.  Test migration.
5.  Test rollback.

------------------------------------------------------------------------

# Navigation

Index files may be provided to help explore the repository.

Examples:

-   `general_index.md` --- overview of major modules
-   `detailed_index.md` --- function-level references

These may not always be up to date. Verify against source files.

------------------------------------------------------------------------

# Additional Documentation

Task-specific instructions are located in:

-   `agent_docs/building.md`
-   `agent_docs/testing.md`
-   `agent_docs/database.md`
-   `agent_docs/deployment.md`

Read only the documentation relevant to your current task.

------------------------------------------------------------------------

# File Modification Boundaries

Do not modify:

-   generated files
-   migration history
-   vendor libraries

Unless explicitly instructed.

------------------------------------------------------------------------

# Subagent Guidance (Optional)

When delegating tasks:

-   Security review → fresh subagent
-   Code exploration → read index files first
-   Documentation tasks → separate subagent

------------------------------------------------------------------------

# Maintenance

When workflows change:

-   Update this file.
-   Update referenced documentation.
-   Ensure commands remain accurate.
