"""Main CLI entry point with Click command structure."""

import click
from rich.console import Console

from .core.client import CodaClient
from .core.config import Config
from .output.conversational import ConversationalOutput


def create_output_manager(format_option: str) -> ConversationalOutput:
    """Create output manager based on format option."""
    console = Console()
    return ConversationalOutput(console)


def create_client(config_path: str = None) -> CodaClient:
    """Create Coda client with error handling."""
    try:
        config = Config() if not config_path else Config(config_path)
        return CodaClient(config)
    except Exception as e:
        console = Console()
        output = ConversationalOutput(console)
        output.error(
            type(
                "ErrorResult",
                (),
                {
                    "success": False,
                    "message": str(e),
                    "error": type(
                        "Error",
                        (),
                        {
                            "what_went_wrong": "Failed to initialize Coda client",
                            "how_to_fix": [
                                "Check your API key is set: echo $CODA_API_KEY",
                                "Run: coda auth setup",
                                "Verify API key at: https://coda.io/account",
                            ],
                            "whats_next": [
                                type(
                                    "Suggestion",
                                    (),
                                    {
                                        "command": "coda auth setup",
                                        "description": "Interactive authentication setup",
                                    },
                                )()
                            ],
                        },
                    )(),
                },
            )()
        )
        raise click.ClickException("Failed to initialize Coda client")


@click.group()
@click.option(
    "--format",
    "output_format",
    default="conversational",
    type=click.Choice(["conversational", "json", "csv", "table"]),
    help="Output format",
)
@click.option("--config", "config_path", help="Configuration file path")
@click.pass_context
def cli(ctx: click.Context, output_format: str, config_path: str) -> None:
    """AI-friendly CLI for Coda documents with conversational outputs."""
    ctx.ensure_object(dict)
    ctx.obj["output_format"] = output_format
    ctx.obj["config_path"] = config_path


@cli.group()
def docs() -> None:
    """Document management commands."""
    pass


@docs.command("list")
@click.option("--query", "-q", help="Search query for documents")
@click.option("--mine", is_flag=True, help="Show only documents you own")
@click.option("--limit", "-l", type=int, help="Maximum number of results")
@click.pass_context
def list_docs(
    ctx: click.Context, query: str, mine: bool, limit: int
) -> None:
    """List Coda documents with search and filtering options.

    Examples:
        coda docs list                    # List all accessible documents
        coda docs list --query "PRD"      # Search for PRD documents  
        coda docs list --mine             # Show only your documents
        coda docs list --limit 10         # Limit to 10 results
    """
    try:
        client = create_client(ctx.obj.get("config_path"))
        output = create_output_manager(ctx.obj["output_format"])

        result = client.list_documents(query=query, owner_only=mine, limit=limit)

        if result.success:
            output.success(result)
            output.skill_snippet("document_list", result.context)
        else:
            output.error(result)

    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        raise click.Abort()


@docs.command("show")
@click.argument("doc_id")
@click.pass_context
def show_doc(ctx: click.Context, doc_id: str) -> None:
    """Show details for a specific document.

    Examples:
        coda docs show AbC123    # Show document details
    """
    try:
        client = create_client(ctx.obj.get("config_path"))
        output = create_output_manager(ctx.obj["output_format"])

        result = client.get_document(doc_id)

        if result.success:
            output.success(result)
            output.skill_snippet("document_details", result.context)
        else:
            output.error(result)

    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        raise click.Abort()


@docs.command("search")
@click.argument("query")
@click.pass_context
def search_docs(ctx: click.Context, query: str) -> None:
    """Search documents by name or content.

    Examples:
        coda docs search "roadmap"    # Search for roadmap documents
        coda docs search "PRD"        # Search for PRD documents
    """
    try:
        client = create_client(ctx.obj.get("config_path"))
        output = create_output_manager(ctx.obj["output_format"])

        result = client.list_documents(query=query)

        if result.success:
            output.success(result)
            output.skill_snippet("document_list", {"query": query})
        else:
            output.error(result)

    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        raise click.Abort()


@cli.group()
def tables() -> None:
    """Table management commands."""
    pass


@tables.command("list")
@click.argument("doc_id")
@click.pass_context
def list_tables(ctx: click.Context, doc_id: str) -> None:
    """List tables in a document.

    Examples:
        coda tables list AbC123    # List all tables in document
    """
    try:
        client = create_client(ctx.obj.get("config_path"))
        output = create_output_manager(ctx.obj["output_format"])

        result = client.list_tables(doc_id)

        if result.success:
            output.success(result)
            output.skill_snippet("document_tables", {"doc_id": doc_id})
        else:
            output.error(result)

    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        raise click.Abort()


@cli.group()
def auth() -> None:
    """Authentication management commands."""
    pass


@auth.command("test")
@click.pass_context
def test_auth(ctx: click.Context) -> None:
    """Test current authentication.

    Examples:
        coda auth test    # Test your API connection
    """
    try:
        client = create_client(ctx.obj.get("config_path"))
        output = create_output_manager(ctx.obj["output_format"])

        result = client.test_authentication()

        if result.success:
            output.success(result)
        else:
            output.error(result)

    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        raise click.Abort()


@auth.command("status")
@click.pass_context
def auth_status(ctx: click.Context) -> None:
    """Show authentication status and configuration.

    Examples:
        coda auth status    # Show current auth configuration
    """
    try:
        config = Config()
        output = create_output_manager(ctx.obj["output_format"])

        status = config.show_config_summary()
        output.info("Authentication Status", status)

    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        raise click.Abort()


if __name__ == "__main__":
    cli()  # pragma: no cover