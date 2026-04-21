# Package Folders Action

Zips each top-level folder in your repository into a separate `.zip` file named after the folder.

## Usage

```yaml
- uses: pierskarsenbarg/package-action@v1
```

## Inputs

| Name | Required | Default | Description |
|------|----------|---------|-------------|
| `working-directory` | No | `.` | Path to scan for top-level folders instead of the repo root |

## Outputs

| Name | Description |
|------|-------------|
| `zip-files` | JSON array of zip file names that were created (e.g. `["alpha.zip","beta.zip"]`) |

## Examples

### Zip all top-level folders

```yaml
steps:
  - uses: actions/checkout@v4

  - id: package
    uses: pierskarsenbarg/package-action@v1

  - run: echo "Created ${{ fromJSON(steps.package.outputs.zip-files)[0] }}"
```

### Zip folders inside a subdirectory

```yaml
steps:
  - uses: actions/checkout@v4

  - id: package
    uses: pierskarsenbarg/package-action@v1
    with:
      working-directory: packages
```

### Upload zips as artifacts

```yaml
steps:
  - uses: actions/checkout@v4

  - id: package
    uses: pierskarsenbarg/package-action@v1

  - uses: actions/upload-artifact@v4
    with:
      name: packages
      path: "*.zip"
```

## Development

```bash
npm install       # install dependencies
npm run build     # bundle to dist/index.js
npm test          # run tests
npm run test:watch  # run tests in watch mode
```
