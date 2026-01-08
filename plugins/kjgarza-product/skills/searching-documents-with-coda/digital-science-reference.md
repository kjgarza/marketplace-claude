# Digital Science Reference

Reference links and documentation for Digital Science products and tools.

## Internal Documentation

| Resource | Description |
|----------|-------------|
| [coda-reference.md](coda-reference.md) | Full Coda CLI command reference |
| [coda-cli README](scripts/coda-cli/README.md) | Installation and development guide |

## Digital Science Products

| Product | Description | Documentation |
|---------|-------------|---------------|
| **Dimensions** | Academic database for publications, grants, patents | [docs.dimensions.ai](https://docs.dimensions.ai) |
| **Overleaf** | Collaborative LaTeX editor | [overleaf.com/learn](https://www.overleaf.com/learn) |
| **Figshare** | Research data repository | [help.figshare.com](https://help.figshare.com) |
| **Altmetric** | Research attention tracking | [altmetric.com/support](https://www.altmetric.com/support) |
| **ReadCube Papers** | Reference management | [readcube.com/papers](https://www.readcube.com/papers/) |
| **Symplectic** | Research information management | [symplectic.co.uk](https://www.symplectic.co.uk) |

## External APIs

| Service | Documentation |
|---------|---------------|
| Coda API | [coda.io/developers/apis/v1](https://coda.io/developers/apis/v1) |
| codaio Python library | [codaio.readthedocs.io](https://codaio.readthedocs.io/) |
| Dimensions API | [docs.dimensions.ai/dsl/](https://docs.dimensions.ai/dsl/) |
| dimcli CLI | [digital-science.github.io/dimcli/](https://digital-science.github.io/dimcli/) |

## Authentication

### Coda API

Get your API key:
1. Go to https://coda.io/account
2. Scroll to "API settings"
3. Click "Generate API token"
4. Set as environment variable: `export CODA_API_KEY="your-key"`

Test authentication:
```bash
uv run coda auth test
```

### Dimensions API

Get your API key:
1. Go to https://app.dimensions.ai/account/tokens
2. Generate a new token
3. Run `dimcli --init` to configure

Test authentication:
```bash
echo 'search publications limit 1' | dimcli
```

