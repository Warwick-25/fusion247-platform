#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '.env.local');

try {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      if (value && !process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  console.error('Could not load .env.local file:', error.message);
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// MCP Server setup
const server = new Server(
  {
    name: 'supabase-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_tables',
        description: 'List all tables in the database',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'get_table_schema',
        description: 'Get the schema for a specific table',
        inputSchema: {
          type: 'object',
          properties: {
            table_name: {
              type: 'string',
              description: 'Name of the table to get schema for',
            },
          },
          required: ['table_name'],
        },
      },
      {
        name: 'query_table',
        description: 'Query data from a table with optional filters',
        inputSchema: {
          type: 'object',
          properties: {
            table_name: {
              type: 'string',
              description: 'Name of the table to query',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of rows to return',
              default: 100,
            },
            where: {
              type: 'object',
              description: 'Optional WHERE conditions',
            },
          },
          required: ['table_name'],
        },
      },
      {
        name: 'run_sql',
        description: 'Run a custom SQL query',
        inputSchema: {
          type: 'object',
          properties: {
            sql: {
              type: 'string',
              description: 'SQL query to execute',
            },
          },
          required: ['sql'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_tables':
        return await listTables();
      
      case 'get_table_schema':
        return await getTableSchema(args.table_name);
      
      case 'query_table':
        return await queryTable(args.table_name, args.limit, args.where);
      
      case 'run_sql':
        return await runSQL(args.sql);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Tool implementations
async function listTables() {
  try {
    console.error('Starting listTables function...');
    
    // First, let's test if we can connect to Supabase at all
    const { data: testData, error: testError } = await supabase
      .from('_test_connection')
      .select('*')
      .limit(1);
    
    console.error('Test connection result:', { testData, testError });
    
    // Try to discover tables by attempting to query common table names
    const commonTables = ['users', 'profiles', 'sessions', 'accounts', 'verification_tokens', 'posts', 'comments', 'categories', 'auth_users', 'user_profiles'];
    const foundTables = [];
    
    for (const tableName of commonTables) {
      try {
        console.error(`Testing table: ${tableName}`);
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        console.error(`Table ${tableName} result:`, { data, error });
        
        if (!error) {
          foundTables.push(tableName);
        }
      } catch (e) {
        console.error(`Error testing table ${tableName}:`, e.message);
        // Table doesn't exist, continue
      }
    }
    
    console.error('Found tables:', foundTables);
    
    if (foundTables.length > 0) {
      return {
        content: [
          {
            type: 'text',
            text: `Found tables:\n${foundTables.map(t => `- ${t}`).join('\n')}`,
          },
        ],
      };
    } else {
      // Let's try to get some basic info about the database
      return {
        content: [
          {
            type: 'text',
            text: `No common tables found. This could mean:\n1. Your database is empty\n2. Tables have different names\n3. There's a permission issue\n\nTry creating a test table or check your Supabase dashboard for existing tables.`,
          },
        ],
      };
    }
  } catch (error) {
    console.error('Error in listTables:', error);
    throw new Error(`Failed to list tables: ${error.message}`);
  }
}

async function getTableSchema(tableName) {
  try {
    // Try to query the table to see its structure
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      throw new Error(`Table '${tableName}' not found or not accessible: ${error.message}`);
    }
    
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      const schemaText = columns.map(col => `${col} (inferred from data)`).join('\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `Schema for table '${tableName}' (inferred from data):\n${schemaText}`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `Table '${tableName}' exists but appears to be empty.`,
          },
        ],
      };
    }
  } catch (error) {
    throw new Error(`Failed to get schema for table '${tableName}': ${error.message}`);
  }
}

async function queryTable(tableName, limit = 100, where = {}) {
  let query = supabase.from(tableName).select('*').limit(limit);
  
  // Apply WHERE conditions if provided
  if (where && Object.keys(where).length > 0) {
    Object.entries(where).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  const { data, error } = await query;

  if (error) throw error;

  return {
    content: [
      {
        type: 'text',
        text: `Query results for table '${tableName}':\n${JSON.stringify(data, null, 2)}`,
      },
    ],
  };
}

async function runSQL(sql) {
  try {
    // For now, we'll try to parse simple SELECT statements and use Supabase client
    if (sql.toLowerCase().includes('select') && sql.toLowerCase().includes('from')) {
      // Extract table name from simple SELECT queries
      const tableMatch = sql.match(/from\s+(\w+)/i);
      if (tableMatch) {
        const tableName = tableMatch[1];
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(100);
        
        if (error) throw error;
        
        return {
          content: [
            {
              type: 'text',
              text: `SQL-like query results for table '${tableName}':\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }
    }
    
    // For complex queries, provide guidance
    return {
      content: [
        {
          type: 'text',
          text: `Complex SQL queries are not yet supported. Try using the specific tools:\n- list_tables: to see available tables\n- get_table_schema: to see table structure\n- query_table: to query specific tables`,
        },
      ],
    };
  } catch (error) {
    throw new Error(`SQL execution failed: ${error.message}`);
  }
}

// Start the server
const transport = new StdioServerTransport();
server.connect(transport);

console.error('Supabase MCP Server started');
