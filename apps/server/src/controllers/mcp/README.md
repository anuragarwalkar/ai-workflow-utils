# MCP Controller

This module handles Model Context Protocol (MCP) client configuration and management.

## Features

- CRUD operations for MCP clients
- Connection testing
- Client status management
- Integration with environment settings

## Usage

The controller provides RESTful endpoints for managing MCP clients:

- `GET /api/mcp/clients` - Get all MCP clients
- `POST /api/mcp/clients` - Create a new MCP client
- `PUT /api/mcp/clients/:id` - Update an existing MCP client
- `DELETE /api/mcp/clients/:id` - Delete an MCP client
- `POST /api/mcp/clients/:id/test` - Test connection to an MCP client

## Architecture

The controller follows functional programming principles and delegates business logic to the MCP service layer.
