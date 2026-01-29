 # AWS TypeScript Pulumi Template

 Pulumi project for URL shortener AWS infrastructure: Lambda functions for create/get short URL and an HTTP API Gateway.

 ## Prerequisites

 - Pulumi CLI (>= v3): https://www.pulumi.com/docs/get-started/install/
 - Node.js (>= 14): https://nodejs.org/
 - AWS credentials configured (e.g., via `aws configure` or environment variables)

 ## Getting Started

 1. Build the server Lambda handlers (from repo root):

    ```bash
    npm run build -w @url-shortener/server
    ```

 2. Initialize a new Pulumi project (if not already):

    ```bash
    pulumi new aws-typescript
    ```

    Follow the prompts to set your:
    - Project name
    - Project description
    - AWS region (defaults to `us-east-1`)

 3. Preview and deploy your infrastructure (from the `infra` directory):

    ```bash
    pulumi preview
    pulumi up
    ```

 4. When you're finished, tear down your stack:

    ```bash
    pulumi destroy
    pulumi stack rm
    ```

 ## Project Layout

 - `Pulumi.yaml` — Pulumi project and template metadata
 - `index.ts` — Main Pulumi program (Lambdas + API Gateway)
 - `package.json` — Node.js dependencies
 - `tsconfig.json` — TypeScript compiler options

 ## Configuration

 | Key           | Description                             | Default     |
 | ------------- | --------------------------------------- | ----------- |
 | `aws:region`  | The AWS region to deploy resources into | `us-east-1` |

 Use `pulumi config set <key> <value>` to customize configuration.

 ## Next Steps

 - Extend `index.ts` to provision additional resources (e.g., VPCs, Lambda functions, DynamoDB tables).
 - Explore [Pulumi AWSX](https://www.pulumi.com/docs/reference/pkg/awsx/) for higher-level AWS components.
 - Consult the [Pulumi documentation](https://www.pulumi.com/docs/) for more examples and best practices.

 ## Getting Help

 If you encounter any issues or have suggestions, please open an issue in this repository.